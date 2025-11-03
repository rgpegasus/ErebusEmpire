function toUrl(text, separator = "-") {
  return text
    .toString()
    .normalize("NFD")               
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, separator)
    .replace(/[^a-zA-Z0-9\-\/]+/g, "")
    .replace(new RegExp(`${separator}+`, "g"), separator)
    .replace(new RegExp(`^${separator}|${separator}$`, "g"), "") 
    .toLowerCase();
}

export { toUrl };
