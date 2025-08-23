window.onload = () => {
  customElements.define(TAG_NODE, TaskNode)
  customElements.define(TAG_BASE, TaskBase)
  customElements.define(TAG_VIEW, TaskView)

  const taskView = document.createElement(TAG_VIEW)
  const taskBase = document.createElement(TAG_BASE)

  taskView.init().appendChild(taskBase)
  document.querySelector('main').appendChild(taskView)

  document.getElementById(ID_ROOT_ADD).addEventListener('click', () => taskBase.addRoot())
  document.getElementById(ID_ROOT_EXPORT).addEventListener('click', () => taskBase.export())
  document.getElementById(ID_ROOT_IMPORT).addEventListener('click', () => taskBase.import())
}
