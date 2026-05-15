import { createRouter, createWebHistory } from 'vue-router'

import StartView from '../views/StartView.vue'
import Rules from '../views/Rules.vue'
import Level1 from '../views/Level1.vue'
import Level2 from '../views/Level2.vue'
import PacmanSushiRoom from '../views/PacmanSushiRoom.vue'
import YouLose from '../views/YouLose.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/start',
      name: 'start',
      component: StartView,
    },
    {
      path: '/rules',
      name: 'rules',
      component: Rules,
    },
    
    {
      path: '/level-1',
      name: 'level-1',
      component: Level1,
    },
    {
      path: '/level-2',
      name: 'level-2',
      component: Level2,
    },
    {
      path: '/level-3',
      name: 'level-3',
      component: PacmanSushiRoom,
    },
      {
      path: '/level-4',
      name: 'level-4',
      component: YouLose,
    }

    
  ],
})

export default router