function renderTaskTree(task) {
  const taskElement = document.createElement(TASK_ELEMENT)
  taskElement.task = task

  taskElement.shadowRoot.querySelector('div').setAttribute('id', `task-${task.task_path.join('')}`)

  // fields
  const taskName = document.createElement(ELEMENT_TASK_FIELD)
  taskName.setAttribute('slot', 'task-name')
  taskName.textContent = task.task_name
  taskElement.appendChild(taskName)

  const taskNote = document.createElement(ELEMENT_TASK_FIELD)
  taskNote.setAttribute('slot', 'task-note')
  taskNote.textContent = task.task_note
  taskElement.appendChild(taskNote)

  // leaf
  if (!task.task_subs?.length) {
    taskElement.shadowRoot.querySelector('div').setAttribute('class', CLASS_LEAF)
    return taskElement
  }

  // branch
  taskElement.shadowRoot.querySelector('div').setAttribute('class', CLASS_BRANCH)

  const subLength = task.task_subs.length
  const numSubs = document.createElement('span')
  numSubs.setAttribute('slot', 'num-subs')
  numSubs.textContent = `Subtasks (${subLength})`
  taskElement.appendChild(numSubs)

  for (const sub in task.task_subs) {
    const subTask = renderTaskTree(task.task_subs[sub])
    subTask.setAttribute('slot', 'task-subs')

    taskElement.appendChild(subTask)
  }

  if (task.task_ui.is_open) {
    taskElement.shadowRoot.querySelector('details').setAttribute('open', '')
  }

  return taskElement
}

window.onload = () => {
  customElements.define(TASK_ELEMENT, TaskElement)
  customElements.define(TASK_BASE_ELEMENT, TaskbaseElement)

  const taskbaseElement = document.createElement(TASK_BASE_ELEMENT)
  const main = document.querySelector('main')
  main.appendChild(taskbaseElement)

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
