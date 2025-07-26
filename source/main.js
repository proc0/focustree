class TaskRender extends HTMLElement {
  constructor() {
    super()

    const renderEvents = [EVENT_BRANCH, EVENT_DELETE]
    renderEvents.forEach((eventName) => {
      this.addEventListener(eventName, this.render.bind(this))
    })
  }
  render(event) {
    const task = event.detail.task
    if (event.type === EVENT_DELETE && event.detail.is_root) {
      event.target.remove()
      return
    }

    const updatedTaskElement = this.renderTaskTree(task)
    updatedTaskElement.setAttribute('slot', 'task-subs')
    updatedTaskElement.shadowRoot.querySelector('details').setAttribute('open', '')

    if (event.type === EVENT_DELETE) {
      event.target.parentElement.replaceWith(updatedTaskElement)
    }

    if (event.type === EVENT_BRANCH) {
      event.target.parentElement.replaceChild(updatedTaskElement, event.target)
    }
  }
  renderTaskTree(task) {
    const taskElement = document.createElement(TASK_ELEMENT)
    taskElement.task = task

    if (task.task_path.length === 1) {
      taskElement.setAttribute('id', task.task_id)
    }
    // taskElement.shadowRoot
    //   .querySelector('div')
    //   .setAttribute('id', `task-${task.task_path.join('')}`)

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
      const subTask = this.renderTaskTree(task.task_subs[sub])
      subTask.setAttribute('slot', 'task-subs')

      taskElement.appendChild(subTask)
    }

    if (task.task_ui.is_open) {
      taskElement.shadowRoot.querySelector('details').setAttribute('open', '')
    }

    return taskElement
  }
}
window.onload = () => {
  customElements.define(TASK_ELEMENT, TaskElement)
  customElements.define(TASK_BASE_ELEMENT, TaskbaseElement)
  customElements.define(TASK_RENDER, TaskRender)

  const taskbaseElement = document.createElement(TASK_BASE_ELEMENT)
  const taskRenderElement = document.createElement(TASK_RENDER)
  taskbaseElement.appendChild(taskRenderElement)
  const main = document.querySelector('main')
  main.appendChild(taskbaseElement)

  const rootAddButton = document.getElementById(ID_BUTTON_ROOT_ADD)
  rootAddButton.addEventListener('click', () => {
    taskbaseElement.addRoot(taskRenderElement.renderTaskTree)
  })

  const rootSaveButton = document.getElementById(ID_BUTTON_ROOT_SAVE)
  rootSaveButton.addEventListener('click', () => {
    const rootTasks = document.querySelectorAll('task-base > task-element')
    console.log(rootTasks)
  })
}
