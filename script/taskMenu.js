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

  // document level event
  clear(event) {
    event.stopImmediatePropagation()
    const rootMenu = document.querySelector(QUERY_ROOT_MENU)
    if (this.isOpen(rootMenu)) this.hide(rootMenu)
    if (this.isOpen()) this.hide()
  }

  // overloaded root + task menu
  isOpen(menu = this) {
    return menu.classList.contains(CLASS_MENU_OPEN)
  }

  isRoot(event) {
    return event?.target?.getAttribute('id') === ID_ROOT_MENU_TOGGLE
  }

  // overloaded root + task menu
  hide(menu = this) {
    menu.classList.remove(CLASS_MENU_OPEN)
    if (menu.node) {
      menu.classList.remove(CLASS_MENU_OPEN)
      menu.removeAttribute('style')
      menu.node.removeClass(CLASS_MENU_OPEN)
      menu.node = null
    }
  }

  // overloaded root + task menu
  open(menu = this) {
    return menu.classList.add(CLASS_MENU_OPEN)
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
    this.open()
  }

  // overloaded root + task menu
  toggle(event) {
    event.stopImmediatePropagation()
    const isRootMenu = this.isRoot(event)
    const menu = isRootMenu ? document.querySelector(QUERY_ROOT_MENU) : this
    if (this.isOpen(menu)) {
      if (event.detail?.node === this.node) {
        return this.hide(menu)
      }

      this.hide(menu)
      // root menu is one instance
      if (isRootMenu) return
    }
    // simple open root menu or show task menu
    return isRootMenu ? this.open(menu) : this.show(event)
  }
}
