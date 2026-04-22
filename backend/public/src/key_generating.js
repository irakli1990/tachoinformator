// ─── Importy ──────────────────────────────────────────────────────────────
import { currentUser } from "./main.js";
// ─── Generowanie kodów ────────────────────────────────────────────────────

function generateKeys(count) {
  const keys = [];
  
  const chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
  const keyLength = 8;
  

  for(let i = 0;i < count;i++){
    let key = '';
    do {
      for(let j = 0;j < keyLength;j++) {
        key += chars[Math.floor(Math.random() * chars.length)];
      }
    } while (keys.includes(key));

    keys.push(key);
  }

  return keys;
}

export { generateKeys };