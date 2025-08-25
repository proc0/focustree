class TaskMenu extends HTMLMenuElement {
  task = null
  node = null

  constructor() {
    super()
    this.bindEvents.bind(this)
  }

  connectedCallback() {
    const menuTemplate = document.getElementById(TEMPLATE_MENU)
    this.append(menuTemplate.content.cloneNode(true))
    this.bindEvents()
  }

  bindEvent(targetName, eventHandler, eventName = 'click') {
    this.selectName(targetName).addEventListener(eventName, (event) => {
      // avoids accidental recursive bindings
      event.stopImmediatePropagation()
      eventHandler(event)
    })
  }

  bindEvents() {
    this.bindEvent(NAME_FOCUS, () => this.node.dispatch(EVENT_FOCUS))
    this.bindEvent(NAME_ADD, () => this.node.dispatch(EVENT_BRANCH))
    this.bindEvent(NAME_EDIT, () => this.node.editMode())
    this.bindEvent(NAME_DELETE, () => this.node.delete())
    this.bindEvent(NAME_SYNC, () => this.node.dispatch(EVENT_SYNC))
    this.bindEvent(
      NAME_STATE,
      ({ target }) => this.node.changeState(Number(target.value)),
      'change'
    )
  }
  //   bindEvents() {
  //     this.selectName(NAME_FOCUS).addEventListener('click', (event) => {
  //       event.stopImmediatePropagation()
  //       this.node.dispatch(EVENT_FOCUS)
  //     })

  //     this.selectName(NAME_ADD).addEventListener('click', (event) => {
  //       event.stopImmediatePropagation()
  //       this.node.dispatch(EVENT_BRANCH)
  //     })

  //     // task edit mode
  //     this.selectName(NAME_EDIT).addEventListener('click', (event) => {
  //       event.stopImmediatePropagation()
  //       this.node.editMode()
  //     })

  //     this.selectName(NAME_DELETE).addEventListener('click', (event) => {
  //       event.stopImmediatePropagation()
  //       this.node.delete()
  //     })

  //     this.selectName(NAME_STATE).addEventListener('click', (event) => {
  //       event.stopImmediatePropagation()
  //     })

  //     // task state selection
  //     this.selectName(NAME_STATE).addEventListener('change', (event) => {
  //       event.stopImmediatePropagation()
  //       this.node.changeState(Number(event.target.value))
  //     })

  //     // sync task tree states
  //     this.selectName(NAME_SYNC).addEventListener('click', (event) => {
  //       event.stopImmediatePropagation()
  //       this.node.dispatch(EVENT_SYNC)
  //     })
  //   }

  clear() {
    this.querySelector(`[name="${NAME_STATE}"] select`)?.remove()
  }

  select(query) {
    return this.querySelector(query)
  }
  selectName(name) {
    return this.querySelector(`[name="${name}"]`)
  }

  show(event) {
    const task = event.detail.task
    const node = event.detail.node
    this.task = task
    this.node = node
    this.clear()
    const stateSelect = this.parentElement.renderSelect(task)
    this.selectName(NAME_STATE).appendChild(stateSelect)
    const menuButton = node.shadowRoot.querySelector('[name="task-menu"]')
    const menuButtonRect = menuButton.getBoundingClientRect()
    const menuRect = this.getBoundingClientRect()

    const menuTop = menuButtonRect.y
    const menuRight = menuButtonRect.x - menuRect.width

    this.setAttribute('style', `top:${menuTop}px; left:${menuRight}px;`)
  }
}
