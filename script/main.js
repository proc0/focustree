window.onload = () => {
  customElements.define(TAG_BASE, TaskBase)
  customElements.define(TAG_VIEW, TaskView)
  customElements.define(TAG_NODE, TaskNode)
  customElements.define(TAG_MENU, TaskMenu, { extends: 'menu' })
  customElements.define(TAG_FOCUS, TaskFocus, { extends: 'dialog' })

  const taskView = document.createElement(TAG_VIEW)
  const taskBase = document.createElement(TAG_BASE)
  const taskFocus = document.createElement('dialog', { is: TAG_FOCUS })
  const taskMenu = document.createElement('menu', { is: TAG_MENU })
  const main = document.querySelector('main')

  // append view first, triggers
  // lifecycle events on children
  main.appendChild(taskView)
  taskView.appendChild(taskMenu)
  taskView.appendChild(taskFocus)
  taskView.appendChild(taskBase)

  // hide menu when clicking anywhere on the document
  // TODO: refactor somewhere else
  document.addEventListener('click', () => {
    taskMenu.hide()
    const menu = document.querySelector('main > menu')
    const isOpen = menu.classList.contains('open')
    if (isOpen) {
      menu.classList.remove('open')
    }
  })
  main.querySelector('button[name="root-menu"]').addEventListener('click', (event) => {
    event.stopPropagation()
    const menuButton = event.target
    const isOpen = menuButton.parentElement.classList.contains('open')
    if (isOpen) {
      menuButton.parentElement.classList.remove('open')
    } else {
      menuButton.parentElement.classList.add('open')
    }
  })
  // handle root menu events
  document.getElementById(ID_ROOT_ADD).addEventListener('click', taskBase.addRoot.bind(taskBase))
  document.getElementById(ID_ROOT_EXPORT).addEventListener('click', taskBase.export.bind(taskBase))
  document.getElementById(ID_ROOT_IMPORT).addEventListener('click', taskBase.import.bind(taskBase))
}
