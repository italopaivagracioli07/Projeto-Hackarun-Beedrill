const container = () => document.querySelector("#toasts");

export function showToast({ title, message = "", variant = "info", life = 5000 }) {
  const toast = document.createElement("div");
  toast.className = `toast ${variant}`;
  toast.style.setProperty("--life", `${life}ms`);

  const heading = document.createElement("strong");
  heading.textContent = title;
  toast.append(heading);
  if (message) {
    const text = document.createElement("p");
    text.textContent = message;
    toast.append(text);
  }

  const close = document.createElement("button");
  close.type = "button";
  close.className = "toast-close";
  close.setAttribute("aria-label", "Fechar aviso");
  close.textContent = "✕";
  toast.append(close);

  const bar = document.createElement("span");
  bar.className = "toast-bar";
  toast.append(bar);

  let closing = false;
  const dismiss = () => {
    if (closing) return;
    closing = true;
    toast.classList.add("leaving");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
    setTimeout(() => toast.remove(), 600); // garantia, caso a animação seja desligada
  };
  close.addEventListener("click", dismiss);
  bar.addEventListener("animationend", dismiss); // a barra termina em `life` ms; passar o mouse pausa

  const host = container();
  host.append(toast);
  while (host.children.length > 3) host.firstElementChild.remove();
  return dismiss;
}
