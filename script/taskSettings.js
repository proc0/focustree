class TaskSettings extends HTMLDialogElement {
  constructor() {
    super()
    this.setAttribute('id', TAG_SETTINGS)
    this.setAttribute('closedby', 'any')
  }

  connectedCallback() {
    const settingsTemplate = document.getElementById(TEMPLATE_SETTINGS)
    this.append(settingsTemplate.content.cloneNode(true))
    this.bindEvents()
  }

  bindEvents() {
    this.addEventListener('change', ({ target }) => {
      document.documentElement.setAttribute('class', `theme-${target.value.toLowerCase()}`)
      document.documentElement.setAttribute('data-theme', `theme-${target.value.toLowerCase()}`)
    })
  }
}
