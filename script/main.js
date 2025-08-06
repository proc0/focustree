window.onload = () => {
  customElements.define(ELEMENT_NODE, TaskNode)
  customElements.define(ELEMENT_BASE, TaskBase)
  customElements.define(ELEMENT_VIEW, TaskView)

  const taskView = document.createElement(ELEMENT_VIEW)
  const taskBase = document.createElement(ELEMENT_BASE)

  taskView.init()
  taskView.appendChild(taskBase)
  document.querySelector('main').appendChild(taskView)

  const rootAddButton = document.getElementById(ID_ROOT_ADD)
  rootAddButton.addEventListener('click', () => {
    taskBase.addRoot()
  })

  const rootExport = document.getElementById(ID_ROOT_EXPORT)
  rootExport.addEventListener('click', () => {
    taskBase.export()
  })

  const rootImport = document.getElementById(ID_ROOT_IMPORT)
  rootImport.addEventListener('click', () => {
    taskBase.import()
  })
}
