from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from datetime import datetime
import motor.motor_asyncio, os
from dotenv import load_dotenv
import httpx

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "ab_deliveries")
COLL_USERS = os.getenv("COLL_USERS", "users")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]
users = db[COLL_USERS]

app = FastAPI(title="A.B Deliveries – Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======== Models ========
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class RegisterToast(BaseModel):
    name: str
    email: EmailStr
    phone: str

# ======== Health ========
@app.get("/health")
async def health():
    return {"ok": True, "time": datetime.utcnow().isoformat()}

# ======== User lookup (for Node + dashboard) ========
@app.get("/api/user")
async def get_user(phone: str):
    if not phone:
        raise HTTPException(status_code=422, detail="Missing phone parameter")

    user = await users.find_one({"phone": phone})
    if not user:
        return {"exists": False}

    return {
        "exists": True,
        "name": user["name"],
        "email": user["email"],
        "phone": user.get("phone", "Not provided"),
        "created_at": user["created_at"].isoformat() if isinstance(user.get("created_at"), datetime) else str(user.get("created_at")),
    }

# ======== Register ========
@app.post("/api/register")
async def register(data: RegisterIn):
    existing = await users.find_one({"$or": [{"email": data.email}, {"phone": data.phone}]})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email/phone already exists")

    hashed = pwd_context.hash(data.password)
    doc = {
        "name": data.name.strip(),
        "email": data.email,
        "phone": data.phone.strip(),
        "password_hash": hashed,
        "created_at": datetime.utcnow(),
    }
    result = await users.insert_one(doc)

    # optional notify Node
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            await c.post("http://localhost:4000/chat", json={
                "name": data.name,
                "phone": data.phone,
                "message": "נרשמתי למערכת A.B Deliveries"
            })
    except Exception as e:
        print(f"Node notify failed: {e}")

    return {"ok": True, "user_id": str(result.inserted_id)}

# ======== Login ========
@app.post("/api/login")
async def login(data: LoginIn):
    user = await users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Email not found")

    if not pwd_context.verify(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect password")

    name = user["name"]
    message = f"{name}, התחברת בהצלחה למערכת 🎉"

    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            await c.post("http://localhost:4000/chat", json={
                "name": name,
                "phone": user.get("phone", "לא צוין"),
                "message": f"המשתמש {name} התחבר למערכת."
            })
    except Exception as e:
        message += f" (Node not responding: {e})"

    return {
        "ok": True,
        "name": name,
        "email": user["email"],
        "phone": user.get("phone", "Not provided"),
        "message": message
    }

# ======== Register toast ========
@app.post("/api/register-toast")
async def register_toast(data: RegisterToast):
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            r = await c.post(
                "http://localhost:4000/register-toast",
                json={
                    "name": data.name,
                    "phone": data.phone,
                    "message": "נרשמתי למערכת A.B Deliveries, שלח הודעת ברכה בעברית."
                },
            )
        reply = r.json().get("reply", "ברוך הבא למערכת A.B Deliveries 🚚")
        return {"ok": True, "toast": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Register toast failed: {str(e)}")
