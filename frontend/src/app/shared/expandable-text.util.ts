/** Detecte si un element de texte depasse sa zone visible (troncature reelle). */
export function elementOverflows(element: HTMLElement): boolean {
  return element.scrollHeight > element.clientHeight + 2;
}
