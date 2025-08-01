window.onload = () => {
  customElements.define(ELEMENT_NODE, TaskNode)
  customElements.define(ELEMENT_BASE, TaskBase)
  customElements.define(ELEMENT_VIEW, TaskView)
  // customElements.define(ELEMENT_FOCUS, TaskView)

  const taskView = document.createElement(ELEMENT_VIEW)
  const taskBase = document.createElement(ELEMENT_BASE)

  taskView.appendChild(taskBase)
  document.querySelector('main').appendChild(taskView)

  const rootAddButton = document.getElementById(ID_ROOT_ADD)
  rootAddButton.addEventListener('click', () => {
    taskBase.addRoot()
  })

  const rootExport = document.getElementById(ID_ROOT_EXPORT)
  rootExport.addEventListener(
    'click',
    () => {
      console.log('exporting')
    },
    { once: true }
  )
}
