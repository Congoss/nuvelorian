export function getChatMessageAvatar(message,selfAvatar,fallback){
 return message?.avatar||message?.photoUrl||message?.photo_url||(message?.own?selfAvatar:fallback)||fallback;
}
