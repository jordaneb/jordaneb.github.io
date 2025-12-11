const editor = document.getElementById("editor")
const preview = document.getElementById("preview")
const downloadButton = document.getElementById("download")
const loadFileInput = document.getElementById("load-file")
const filenameInput = document.getElementById("filename")
const clearButton = document.getElementById("clear")

const storageKey = "jordaneb-editor-draft"

function renderPreview(text) {
  preview.innerHTML = marked.parse(text)
}

function saveDraft(text) {
  localStorage.setItem(storageKey, text)
}

function loadDraft() {
  return localStorage.getItem(storageKey) || ""
}

function downloadMarkdown() {
  const filename = filenameInput.value.trim() || "post.md"
  const blob = new Blob([editor.value], { type: "text/markdown;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function loadMarkdownFile(file) {
  const reader = new FileReader()
  reader.onload = () => {
    const text = String(reader.result || "")
    editor.value = text
    renderPreview(text)
    saveDraft(text)
    if (file.name) filenameInput.value = file.name
  }
  reader.readAsText(file)
}

editor.value = loadDraft()
renderPreview(editor.value)

editor.addEventListener("input", event => {
  const text = event.target.value
  renderPreview(text)
  saveDraft(text)
})

downloadButton.addEventListener("click", downloadMarkdown)

loadFileInput.addEventListener("change", event => {
  const file = event.target.files?.[0]
  if (file) loadMarkdownFile(file)
  event.target.value = ""
})

clearButton.addEventListener("click", () => {
  editor.value = ""
  renderPreview("")
  saveDraft("")
})

