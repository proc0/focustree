class TaskMenu extends HTMLMenuElement {
  node = null

  constructor() {
    super()
  }

  connectedCallback() {
    const template = document.getElementById(TEMPLATE_MENU)
    this.append(template.content.cloneNode(true))
    this.bindEvents()
  }

  bindEvent(targetName, eventHandler, eventName = 'click') {
    this.selectName(targetName).addEventListener(eventName, (event) => {
      // avoids accidental recursive bindings
      event.stopImmediatePropagation()
      if (!this.node) return
      eventHandler(event)
    })
  }

  bindEvents() {
    this.bindEvent(NAME_FOCUS, () => {
      this.node.dispatch(EVENT_FOCUS)
      this.hide()
    })

    this.bindEvent(NAME_ADD, () => {
      this.node.dispatch(EVENT_BRANCH)
      setTimeout(() => this.hide(), 1200)
    })

    this.bindEvent(NAME_EDIT, () => {
      this.node.editMode()
      this.hide()
    })

    this.bindEvent(
      NAME_STATE,
      ({ target }) => this.node.changeState(Number(target.value)),
      'change'
    )

    this.selectName(NAME_STATE).addEventListener('click', (event) => {
      event.stopImmediatePropagation()
    })

    this.bindEvent(NAME_SYNC, () => this.node.dispatch(EVENT_SYNC))

    this.bindEvent(NAME_DELETE, () => {
      this.node.delete()
      this.hide()
    })
  }

  isOpen() {
    return !!this.node
  }

  hide() {
    if (!this.node) return
    this.removeAttribute('style')
    this.node.removeClass(CLASS_MENU_OPEN)
    this.node = null
  }

  select(query) {
    return this.querySelector(query)
  }

  selectName(name) {
    return this.querySelector(`[name="${name}"]`)
  }

  show(event) {
    this.node = event.detail.node

    this.querySelector(`[name="${NAME_STATE}"] select`)?.remove()
    const stateSelect = this.parentElement.renderSelect(this.node.task)
    this.selectName(NAME_STATE).appendChild(stateSelect)
    this.node.addClass(CLASS_MENU_OPEN)

    const menuButton = this.node.selectName(NAME_MENU)
    const menuButtonRect = menuButton.getBoundingClientRect()
    const menuRect = this.getBoundingClientRect()

    const menuTop =
      menuButtonRect.y + window.pageYOffset - menuRect.height / 2 + menuButtonRect.height / 2
    const menuRight = menuButtonRect.x + menuButtonRect.width + window.pageXOffset + 5
    this.setAttribute(
      'style',
      `top:${menuTop}px; left:${menuRight}px; visibility: visible; opacity: 1`
    )
  }
}
