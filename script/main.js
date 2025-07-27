window.onload = () => {
  customElements.define(ELEMENT_NODE, TaskNode)
  customElements.define(ELEMENT_BASE, TaskBase)
  customElements.define(ELEMENT_VIEW, TaskView)

  const taskRenderElement = document.createElement(ELEMENT_VIEW)
  const taskbaseElement = document.createElement(ELEMENT_BASE)
  taskRenderElement.appendChild(taskbaseElement)

  document.querySelector('main').appendChild(taskRenderElement)

  const rootAddButton = document.getElementById(ID_ROOT_ADD)
  rootAddButton.addEventListener('click', () => {
    taskbaseElement.addRoot()
  })

  const rootSaveButton = document.getElementById(ID_ROOT_SAVE)
  rootSaveButton.addEventListener('click', () => {
    const rootTasks = document.querySelectorAll('task-base > task-node')
    console.log(rootTasks)
  })
}
