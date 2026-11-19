import { createNativeSelect } from "@zealakit/omniselect-vanilla/native";
import "./styles.css";

const root = document.getElementById("fruit") as HTMLElement;
const output = document.getElementById("value") as HTMLElement;
const submitted = document.getElementById("submitted") as HTMLElement;
const form = document.getElementById("form") as HTMLFormElement;

createNativeSelect(root, {
  onValueChange: (value) => {
    output.textContent = String(value || "none");
  },
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitted.textContent = JSON.stringify([...new FormData(form).entries()]);
});
