class TaskMenu extends HTMLMenuElement {
  task = null

  constructor() {
    super()
  }

  connectedCallback() {
    const menuTemplate = document.getElementById(TEMPLATE_MENU)
    this.append(menuTemplate.content.cloneNode(true))
    // this.bindEvents()
  }

  show(event) {
    const task = event.detail.task
    const node = event.detail.node
    this.task = task

    const menuButton = node.shadowRoot.querySelector('[name="task-menu"]')
    const menuButtonRect = menuButton.getBoundingClientRect()
    const menuRect = this.getBoundingClientRect()

    const menuTop = menuButtonRect.y
    const menuRight = menuButtonRect.x - menuRect.width

    this.setAttribute('style', `top:${menuTop}px; left:${menuRight}px;`)
  }
}
