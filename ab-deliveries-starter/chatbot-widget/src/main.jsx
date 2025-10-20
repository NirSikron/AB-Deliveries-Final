import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";

const NODE_API = import.meta.env.VITE_NODE_API || "http://localhost:4000";

function ChatWidget(){
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [text, setText] = useState("");
  const [chat, setChat] = useState([]);
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));

  const send = async () => {
    if(!text.trim()) return;
    const msg = text;
    setChat(prev => [...prev, {who:"me", text: msg}]);
    setText("");
    const r = await axios.post(NODE_API + "/api/chatbot", { name, phone, message: msg, sessionId });
    setChat(prev => [...prev, {who:"bot", text: r.data?.reply || ""}]);
  };

  return (
    <div>
      <button onClick={()=>setOpen(v=>!v)} style={{position:"fixed", right:16, bottom:16, background:"#5b6bf6", color:"#fff", border:"0", borderRadius:999, padding:"12px 16px", fontWeight:700}}>
        צ'אט
      </button>
      {open && (
        <div style={{position:"fixed", right:16, bottom:70, width:320, height:420, background:"#fff", borderRadius:16, boxShadow:"0 10px 30px rgba(0,0,0,.15)", display:"flex", flexDirection:"column"}}>
          <div style={{padding:10, borderBottom:"1px solid #eee"}}>
            <div style={{fontWeight:800}}>A.B Deliveries – Agent</div>
            <div style={{fontSize:12, color:"#666"}}>תמיכה ומכירות</div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginTop:8}}>
              <input placeholder="שם" value={name} onChange={e=>setName(e.target.value)} style={{border:"1px solid #ddd", borderRadius:8, padding:8}}/>
              <input placeholder="טלפון" value={phone} onChange={e=>setPhone(e.target.value)} style={{border:"1px solid #ddd", borderRadius:8, padding:8}}/>
            </div>
          </div>
          <div style={{flex:1, overflowY:"auto", padding:10, display:"flex", flexDirection:"column", gap:8}}>
            {chat.map((c,i)=> (
              <div key={i} style={{alignSelf: c.who==="me" ? "flex-end":"flex-start", background:c.who==="me"?"#e9ebff":"#f1f5f9", padding:"8px 10px", borderRadius:12, maxWidth:"80%"}}>{c.text}</div>
            ))}
          </div>
          <div style={{padding:10, borderTop:"1px solid #eee", display:"flex", gap:8}}>
            <input value={text} onChange={e=>setText(e.target.value)} placeholder="כתוב הודעה..." style={{flex:1, border:"1px solid #ddd", borderRadius:999, padding:"10px 12px"}}/>
            <button onClick={send} style={{background:"#5b6bf6", color:"#fff", border:"0", borderRadius:999, padding:"10px 12px", fontWeight:700}}>שלח</button>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<ChatWidget/>);
