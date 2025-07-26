window.onload = () => {
  customElements.define(TASK_ELEMENT, TaskElement)
  customElements.define(TASK_BASE_ELEMENT, TaskbaseElement)
  customElements.define(TASK_RENDER_ELEMENT, TaskRenderElement)

  const taskRenderElement = document.createElement(TASK_RENDER_ELEMENT)
  const taskbaseElement = document.createElement(TASK_BASE_ELEMENT)
  taskRenderElement.appendChild(taskbaseElement)

  document.querySelector('main').appendChild(taskRenderElement)

  const rootAddButton = document.getElementById(ID_BUTTON_ROOT_ADD)
  rootAddButton.addEventListener('click', () => {
    taskbaseElement.addRoot()
  })

  const rootSaveButton = document.getElementById(ID_BUTTON_ROOT_SAVE)
  rootSaveButton.addEventListener('click', () => {
    const rootTasks = document.querySelectorAll('task-base > task-element')
    console.log(rootTasks)
  })
}
