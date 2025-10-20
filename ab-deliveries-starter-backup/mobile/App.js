import React, { useState } from "react";
import { SafeAreaView, View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import axios from "axios";

const PY_API = process.env.EXPO_PUBLIC_PY_API || "http://10.0.2.2:8000";
const NODE_API = process.env.EXPO_PUBLIC_NODE_API || "http://10.0.2.2:4000";

export default function App(){
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"" });
  const [loading, setLoading] = useState(false);
  const onChange = (k,v) => setForm(prev => ({...prev, [k]: v}));

  const onSubmit = async () => {
    setLoading(true);
    try{
      await axios.post(`${PY_API}/api/register`, form);
      const r = await axios.get(`${NODE_API}/api/random-toast`);
      Toast.show({ type:"success", text1: r.data?.message || "נרשמת בהצלחה!" });
      setForm({ name:"", email:"", phone:"", password:"" });
    }catch(err){
      const msg = err?.response?.data?.detail || "שגיאה בהרשמה";
      Toast.show({ type:"error", text1: String(msg) });
    }finally{
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{flex:1, backgroundColor:"#f5f7ff"}}>
      <View style={{flex:1, alignItems:"center", justifyContent:"center"}}>
        <View style={{width:"86%", backgroundColor:"#fff", padding:20, borderRadius:16}}>
          <Text style={{fontSize:22, fontWeight:"700", textAlign:"center"}}>הרשמה</Text>
          <Text>שם</Text>
          <TextInput value={form.name} onChangeText={(v)=>onChange("name", v)} style={{borderWidth:1, borderColor:"#d1d5db", borderRadius:8, padding:10, marginBottom:10}}/>
          <Text>אימייל</Text>
          <TextInput value={form.email} onChangeText={(v)=>onChange("email", v)} keyboardType="email-address" style={{borderWidth:1, borderColor:"#d1d5db", borderRadius:8, padding:10, marginBottom:10}}/>
          <Text>טלפון</Text>
          <TextInput value={form.phone} onChangeText={(v)=>onChange("phone", v)} keyboardType="phone-pad" style={{borderWidth:1, borderColor:"#d1d5db", borderRadius:8, padding:10, marginBottom:10}}/>
          <Text>סיסמה</Text>
          <TextInput value={form.password} onChangeText={(v)=>onChange("password", v)} secureTextEntry style={{borderWidth:1, borderColor:"#d1d5db", borderRadius:8, padding:10, marginBottom:16}}/>
          <Pressable onPress={onSubmit} style={{backgroundColor:"#5b6bf6", padding:12, borderRadius:999, alignItems:"center"}}>
            {loading ? <ActivityIndicator color="#fff"/> : <Text style={{color:"#fff", fontWeight:"700"}}>הירשם</Text>}
          </Pressable>
        </View>
      </View>
      <Toast />
    </SafeAreaView>
  );
}
