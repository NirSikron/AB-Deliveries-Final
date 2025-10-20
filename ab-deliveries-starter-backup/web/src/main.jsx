import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PY_API = import.meta.env.VITE_PY_API || "http://localhost:8000";
const NODE_API = import.meta.env.VITE_NODE_API || "http://localhost:4000";

function App(){
  const [form, setForm] = useState({ name: "", email:"", phone:"", password:"" });
  const [loading, setLoading] = useState(false);

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try{
      await axios.post(PY_API + "/api/register", form);
      const r = await axios.get(NODE_API + "/api/random-toast");
      toast.success(r.data?.message || "נרשמת בהצלחה!");
      setForm({ name:"", email:"", phone:"", password:"" });
    }catch(err){
      const msg = err?.response?.data?.detail || "שגיאה בהרשמה";
      toast.error(String(msg));
    }finally{
      setLoading(false);
    }
  };

  return (
    <div style={{display:"grid",placeItems:"center",height:"100dvh",background:"#f5f7ff"}}>
      <form onSubmit={onSubmit} style={{background:"#fff", padding:24, borderRadius:16, width:360, boxShadow:"0 10px 30px rgba(0,0,0,.08)"}}>
        <h2 style={{marginTop:0, textAlign:"center"}}>הרשמה</h2>
        <label>שם</label>
        <input name="name" value={form.name} onChange={onChange} required style={{width:"100%",padding:10,margin:"6px 0 12px", borderRadius:8, border:"1px solid #d1d5db"}}/>
        <label>אימייל</label>
        <input type="email" name="email" value={form.email} onChange={onChange} required style={{width:"100%",padding:10,margin:"6px 0 12px", borderRadius:8, border:"1px solid #d1d5db"}}/>
        <label>טלפון</label>
        <input name="phone" value={form.phone} onChange={onChange} required style={{width:"100%",padding:10,margin:"6px 0 12px", borderRadius:8, border:"1px solid #d1d5db"}}/>
        <label>סיסמה</label>
        <input type="password" name="password" value={form.password} onChange={onChange} required style={{width:"100%",padding:10,margin:"6px 0 12px", borderRadius:8, border:"1px solid #d1d5db"}}/>
        <button disabled={loading} style={{width:"100%", padding:12, border:0, borderRadius:999, background:"#5b6bf6", color:"#fff", fontWeight:600}}>
          {loading ? "שולח..." : "הירשם"}
        </button>
      </form>
      <ToastContainer position="bottom-center"/>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App/>);
