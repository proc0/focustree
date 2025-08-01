const CLASS_BRANCH = 'branch'
const CLASS_LEAF = 'leaf'

class TaskView extends HTMLElement {
  constructor() {
    super()
    this.focusTree = []
    this.currentFocus = 0
    this.isDeepFocus = false
    this.addEventListener(EVENT_RENDER, this.render.bind(this))
    this.addEventListener(EVENT_DELETE, this.delete.bind(this))
    this.addEventListener(EVENT_FOCUS, this.focus.bind(this))
  }

  delete({ detail, target }) {
    // root task delete
    if (detail?.task.id) {
      target.remove()
    }
  }

  deepFocus(task) {
    const dialog = this.querySelector('dialog')

    dialog.querySelector('[slot="task-name"').textContent = task.name
  }

  focus(event) {
    const focusTemplate = document.getElementById(TEMPLATE_FOCUS).content.cloneNode(true)
    const focusDialog = focusTemplate.querySelector('dialog')
    // const taskBase = this.querySelector(ELEMENT_BASE)
    const taskElement = event.target
    const task = event.detail.task

    // this.focusTree = taskElement.querySelectorAll('task-node')
    // const getFocusTree = (node, tree) => {
    //   let childTasks = []
    //   node.childNodes.forEach((child) => {
    //     if (child.tagName === ELEMENT_NODE.toUpperCase()) {
    //       childTasks.push(child)
    //       const subTasks = getFocusTree(child, childTasks)
    //       childTasks = childTasks.concat(subTasks)
    //     }
    //   })
    //   return childTasks
    // }
    // this.focusTree = getFocusTree(taskElement, this.focusTree)

    // this.focusTree = taskElement
    this.currentFocus = 0
    this.isDeepFocus = false

    const taskName = document.createElement(ELEMENT_FIELD)
    taskName.setAttribute('slot', SLOT_NAME)
    taskName.textContent = task.name
    focusDialog.appendChild(taskName)

    //listen to escape key event
    focusDialog.addEventListener('keyup', (event) => {
      event.preventDefault()

      if (event.key === 'Escape') {
        focusDialog.remove()
      }

      // if (event.key === ' ') {
      //   // if (this.focusTree.length && this.currentFocus < this.focusTree.length - 1) {
      //   //   if (this.isDeepFocus) {
      //   //     this.currentFocus++
      //   //     const nextTask = this.focusTree[this.currentFocus]
      //   //     nextTask.task.state.current = 1
      //   //     nextTask.dispatch(EVENT_STATES, nextTask.task)
      //   //     this.deepFocus(nextTask.task)
      //   //   } else {
      //   //     this.isDeepFocus = true
      //   //     this.focusTree.task.state.current = 1
      //   //     this.focusTree.dispatch(EVENT_STATES, task)
      //   //   }
      //   // }

      //   this.isDeepFocus = true
      //   this.focusTree.task.state.current = 1
      //   this.focusTree.dispatch(EVENT_STATES, task)
      // }
    })

    focusDialog.querySelector('[name="task-done"]').addEventListener('click', (event) => {
      // this.focusTree = taskElement.querySelectorAll('task-node')

      // if (this.focusTree.length && this.currentFocus < this.focusTree.length - 1) {
      if (this.isDeepFocus) {
        // this.currentFocus++
        let nextTask = this.querySelector('task-node[data-focused] > task-node')
        const prevTask = this.querySelector('task-node[data-focused]')
        // const nextTask = this.focusTree[this.currentFocus]
        if (!nextTask) {
          nextTask = this.querySelector('task-node[data-focused]').nextSibling
          if (!nextTask) {
            const parentTask = this.querySelector('task-node[data-focused]').parentElement

            if (parentTask === taskElement) {
              focusDialog.remove()
              return
            }
            nextTask = parentTask.nextSibling
          }
        }
        // const parentTask = nextTask.parentElement
        prevTask.task.state.focused = false
        prevTask.dispatch(EVENT_STATES, prevTask.task)

        nextTask.task.state.current = 1
        nextTask.task.state.focused = true
        nextTask.dispatch(EVENT_STATES, nextTask.task)
        this.deepFocus(nextTask.task)
      } else {
        this.isDeepFocus = true
        taskElement.task.state.current = 1
        taskElement.task.state.focused = true
        taskElement.dispatch(EVENT_STATES, task)
      }
      // }
    })

    this.append(focusDialog)
  }

  render({ detail, target }) {
    const task = detail.task
    const taskNode = this.renderTaskNode(task)

    // root add event does not have node to replace
    if (task.id && !detail?.node) {
      // append root tasks to task-base
      return target.appendChild(taskNode)
    }

    // branching subtask
    taskNode.setAttribute('slot', SLOT_SUBS)
    // replace node with updated node
    detail.node.replaceWith(taskNode)
  }

  renderTaskNode(task) {
    const taskNode = document.createElement(ELEMENT_NODE)
    taskNode.task = task
    // fade in tasks, prevents FOUC
    taskNode.classList.add('fade-in')

    // set the task path
    taskNode.shadowRoot.querySelector('div').setAttribute('data-path', task.path)

    // fields
    const taskName = document.createElement(ELEMENT_FIELD)
    taskName.setAttribute('slot', SLOT_NAME)
    taskName.textContent = task.name
    taskNode.appendChild(taskName)

    const taskNote = document.createElement(ELEMENT_FIELD)
    taskNote.setAttribute('slot', SLOT_NOTE)
    taskNote.textContent = task.note
    taskNode.appendChild(taskNote)

    const taskState = document.createElement('select')
    taskState.setAttribute('slot', SLOT_STATE)
    task.state.options.forEach((state, index) => {
      const option = document.createElement('option')
      option.value = index
      option.textContent = state
      taskState.appendChild(option)
      if (index === task.state.current) {
        option.setAttribute('selected', '')
        taskState.value = index
      }
    })
    taskNode.appendChild(taskState)

    if (task.state.focused) {
      taskNode.setAttribute('data-focused', '')
    }

    const container = taskNode.shadowRoot.querySelector('div')

    // leaf
    if (!task.subs?.length) {
      container.classList.add(CLASS_LEAF)
      return taskNode
    }

    // branch
    container.classList.add(CLASS_BRANCH)

    const subsLength = task.subs.length
    const subsLabel = document.createElement(ELEMENT_LABEL)
    subsLabel.setAttribute('slot', SLOT_TITLE_SUBS)
    subsLabel.textContent = `${TEXT_SUBS} (${subsLength})`
    taskNode.appendChild(subsLabel)

    for (const sub in task.subs) {
      const subTask = this.renderTaskNode(task.subs[sub])
      subTask.setAttribute('slot', SLOT_SUBS)

      taskNode.appendChild(subTask)
    }

    if (task.meta.isOpen) {
      taskNode.shadowRoot.querySelector('details').setAttribute('open', '')
    }

    return taskNode
  }
}
