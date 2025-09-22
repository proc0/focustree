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
    const cachedTheme = localStorage.getItem('task-theme')
    if (cachedTheme) {
      this.setTheme(cachedTheme)
      this.setOption(cachedTheme)
    }
  }

  bindEvents() {
    this.addEventListener('change', ({ target }) => {
      this.setTheme(target.value)
      document.querySelector('task-view').refresh()
    })

    this.addEventListener('close', () => {
      setTimeout(() => {
        this.querySelector('#info').classList.add('hidden')
        this.querySelector('#settings').classList.remove('hidden')
      }, 500)
    })
  }

  setTheme(theme) {
    localStorage.setItem('task-theme', theme)
    document.documentElement.setAttribute('class', `theme-${theme.toLowerCase()}`)
    document.documentElement.setAttribute('data-theme', `theme-${theme.toLowerCase()}`)
  }

  setOption(theme) {
    this.querySelectorAll('option').forEach((option) => {
      if (option.value !== theme) {
        option.removeAttribute('selected')
      } else {
        option.setAttribute('selected', '')
      }
    })
  }

  showInfo() {
    this.querySelector('#settings').classList.add('hidden')
    this.querySelector('#info').classList.remove('hidden')
    return this
  }
}
