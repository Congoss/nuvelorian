import './chatBeacon.css';
export default function ChatBeacon({patch=false,unread=false}){
 if(patch)return <span className="chat-patch-lamp" role="img" aria-label="Новий патчлог"/>;
 return unread?<span className="chat-unread-beacon" role="img" aria-label="Непрочитані повідомлення"/>:null;
}
