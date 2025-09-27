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
        this.querySelector('#guide').classList.add('hidden')
        this.querySelector('#settings').classList.remove('hidden')
      }, 500)
    })

    this.querySelectorAll('#guide button').forEach((button) => {
      button.addEventListener('click', (event) => {
        const direction = event.target.getAttribute('id').split('-')[1]
        const listItems = this.querySelectorAll('#guide ul li')

        for (let i = 0; i < listItems.length; i++) {
          const item = listItems[i]
          const isVisible = item.classList.contains('visible')
          item.classList.remove('visible')
          if (isVisible) {
            let index
            if (direction === 'next') {
              index = i === listItems.length - 1 ? 0 : i + 1
            } else {
              index = i === 0 ? listItems.length - 1 : i - 1
            }
            listItems[index].classList.add('visible')
            break
          }
        }
      })
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

  showGuide() {
    this.querySelector('#settings').classList.add('hidden')
    this.querySelector('#guide').classList.remove('hidden')
    return this
  }
}
