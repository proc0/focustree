window.onload = () => {
  /* Initialize Elements
  |*-------------------------*/
  // define custom elements
  customElements.define(TAG_BASE, TaskBase)
  customElements.define(TAG_VIEW, TaskView)
  customElements.define(TAG_NODE, TaskNode)
  customElements.define(TAG_MENU, TaskMenu, { extends: 'menu' })
  customElements.define(TAG_FOCUS, TaskFocus, { extends: 'dialog' })
  // instantiate custom elements
  const taskView = document.createElement(TAG_VIEW)
  const taskBase = document.createElement(TAG_BASE)
  const taskFocus = document.createElement('dialog', { is: TAG_FOCUS })
  const taskMenu = document.createElement('menu', { is: TAG_MENU })
  const main = document.querySelector('main')

  /* Connect Elements
  |*-------------------------*/
  // append view first - triggers
  // lifecycle events on children
  main.appendChild(taskView)
  taskView.appendChild(taskMenu)
  taskView.appendChild(taskFocus)
  taskView.appendChild(taskBase)

  /* Root Events
  |*--------------------------------------------------*/
  // clear menus when clicking anywhere on the document
  document.addEventListener('click', taskMenu.clear.bind(taskMenu))
  // root menu button
  document
    .getElementById(ID_ROOT_MENU_TOGGLE)
    .addEventListener('click', taskMenu.toggle.bind(taskMenu))
  // root menu actions
  document.getElementById(ID_ROOT_ADD).addEventListener('click', taskBase.addRoot.bind(taskBase))
  document.getElementById(ID_ROOT_EXPORT).addEventListener('click', taskBase.export.bind(taskBase))
  document.getElementById(ID_ROOT_IMPORT).addEventListener('click', taskBase.import.bind(taskBase))
}
