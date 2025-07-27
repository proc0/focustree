window.onload = () => {
  customElements.define(TASK_ELEMENT, TaskElement)
  customElements.define(TASKBASE_ELEMENT, TaskbaseElement)
  customElements.define(TASKVIEW_ELEMENT, TaskviewElement)

  const taskRenderElement = document.createElement(TASKVIEW_ELEMENT)
  const taskbaseElement = document.createElement(TASKBASE_ELEMENT)
  taskRenderElement.appendChild(taskbaseElement)

  document.querySelector('main').appendChild(taskRenderElement)

  const rootAddButton = document.getElementById(ID_BUTTON_ROOT_ADD)
  rootAddButton.addEventListener('click', () => {
    taskbaseElement.addRoot()
  })

  const rootSaveButton = document.getElementById(ID_BUTTON_ROOT_SAVE)
  rootSaveButton.addEventListener('click', () => {
    const rootTasks = document.querySelectorAll('task-base > task-node')
    console.log(rootTasks)
  })
}
