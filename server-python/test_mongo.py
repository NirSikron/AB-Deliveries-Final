import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def test():
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv("MONGO_URI"))
    print(await client.server_info())

asyncio.run(test())
