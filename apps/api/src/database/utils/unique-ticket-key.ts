export function generateUniqueTicketId(length: number = 6): string {
  const characters =
    "0123456789";
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  let uniqueString = `TKT-${year}-`;
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    uniqueString += characters[randomIndex];
  }
  return uniqueString;
}