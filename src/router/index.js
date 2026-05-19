import { createRouter, createWebHistory } from 'vue-router'

import StartView from '../views/StartView.vue'
import Level2 from '../views/Level2.vue'
import AlgorithmRoom from '../views/AlgorithmRoom.vue'
import AlignRoom from '../views/AlignRoom.vue'
import AlignRoom2 from '../views/AlignRoom2.vue'
import AntennaRoom from '../views/AntennaRoom.vue'
import AntiVirus from '../views/AntiVirus.vue'
import AuroraRoom from '../views/AuroraRoom.vue'
import BlockEscape from '../views/BlockEscape.vue'
import ChefAITrainingSimulator from '../views/ChefAITrainingSimulator.vue'
import ElinaHappy from '../views/ElinaHappy.vue'
import FogNavigationRoom from '../views/FogNavigationRoom.vue'
import CipherRoom from '../views/CipherRoom.vue'
import Horald from '../views/Horald.vue'
import FakeAI from '../views/FakeAI.vue'
import HangmanRoom from '../views/HangmanRoom.vue'
import LoadingScreen from '../views/LoadingScreen.vue'
import Food from '../views/Food.vue'
import MouseFollower from '../views/MouseFollower.vue'
import NavigationRoom from '../views/NavigationRoom.vue'
import Merch from '../views/Merch.vue'
import MedAndraOrd from '../views/MedAndraOrd.vue'
import NobelRoom from '../views/NobelRoom.vue'
import Nudel from '../views/Nudel.vue'
import Nokia from '../views/Nokia.vue'
import SushiConveyor from '../views/SushiConveyor.vue' 
import Rules from '../views/Rules.vue'
import PacmanSushiRoom from '../views/PacmanSushiRoom.vue'
import PhaseDrift from '../views/PhaseDrift.vue'
import Terminal from '../views/Terminal.vue'
import WordSearchRoom from '../views/WordSearchRoom.vue'
import YouLose from '../views/YouLose.vue'
import TrainLevel7 from '../views/TrainLevel7.vue'
import ChoosePhotoClue from '../views/ChoosePhotoClue.vue'
import TimelinePhoto from '../views/TimelinePhoto.vue'
import WhichElinaMood from '../views/WhichElinaMood.vue'
import PhotoLock from '../views/PhotoLock.vue'
import AvoidFakeElinas from '../views/AvoidFakeElinas.vue'
import HeartHunt from '../views/HeartHunt.vue'
import RamlosaHeist from '../views/RamlosaHeist.vue'
import RamlosaHemligaOperationen from '../views/RamlosaHemligaOperationen.vue'


const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
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
      component: Level2,
    },
    {
      path: '/level-2',
      name: 'level-2',
      component: PacmanSushiRoom,
    },
    {
      path: '/level-3',
      name: 'level-3',
      component: Nudel,
    },
       {
      path: '/level-4',
      name: 'level-4',
      component: WordSearchRoom,
    },
    {
      path: '/level-5',
      name: 'level-5',
      component: MedAndraOrd,
    },
    {
      path: '/level-6',
      name: 'level-6',
      component: Merch,
    },
    { path: '/level-7',
      name: 'level-7',
      component: Terminal,
    },
    { path: '/level-8',
      name: 'level-8',
      component: RamlosaHeist,
    },
    {
      path: '/level-9',
      name: 'level-9',
      component: AuroraRoom,
    },
    {path: '/level-10',
      name: 'level-10',
      component: MouseFollower,
    },
    {path: '/level-11',
      name: 'level-11',
      component: RamlosaHemligaOperationen,
    },
    {path: '/level-12',
      name: 'level-12',
      component: BlockEscape,
    },
    {
      path: '/level-14',
      name: 'level-14',
      component: LoadingScreen,
    },
    {
      path: '/level-16',
      name: 'level-16',
      component: ChefAITrainingSimulator,   
    },
    {path: '/level-17',
      name: 'level-17',
      component: SushiConveyor,
    },
    {path: '/level-19',
      name: 'level-19',
      component: NavigationRoom,
    },
    {
      path: '/level-20',
      name: 'level-20',
      component: NobelRoom,
    },
      {
      path: '/level-22',
      name: 'level-22',
      component: TrainLevel7,
    },
    {
      path: '/level-23',
      name: 'level-23',
      component: YouLose,
    },
    { path: '/level-24',
      name: 'level-24',
      component: AlignRoom2,
    },
    {
      path: '/level-25',
      name: 'level-25',
      component: Food,
    },
    {
      path: '/level-27',
      name: 'level-27',
      component: PhaseDrift,
    },
    {
      path: '/level-28',
      name: 'level-28',
      component: AvoidFakeElinas,
    },
    {
      path: '/level-29',
      name: 'level-29',
      component: Nokia,

    },
    { path: '/level-30',
      name: 'level-30',
      component: ChoosePhotoClue,
    },
    { path: '/level-31',
      name: 'level-31',
      component: TimelinePhoto,
    },
    {path: '/level-32',
      name: 'level-32',
      component: HeartHunt,
    },
    {path: '/level-33',
      name: 'level-33',
      component: WhichElinaMood,
    },
    {path: '/level-34',
      name: 'level-34',
      component: PhotoLock,
    },
    {
      path: '/level-35',
      name: 'level-35',
      component: HangmanRoom,
    },
        {
      path: '/level-36',
      name: 'level-36',
      component: FogNavigationRoom,
    },
    {
      path: '/level-37',
      name: 'level-37',
      component: Horald,
    },
    {
      path: '/level-38',
      name: 'level-38',
      component: FakeAI,
    },
    {
      path: '/level-40',
      name: 'level-40',
      component: CipherRoom,
    },
    {
      path: '/level-42',
      name: 'level-42',
      component: AntiVirus,
    },
    {
      path: '/level-43',
      name: 'level-43',
      component: AntennaRoom,
    },
    { 
      path: '/level-44',
      name: 'level-44',
      component: AlignRoom,
    },
    {
      path: '/level-45',
      name: 'level-45',
      component: AlgorithmRoom,
    },
    {
      path: '/level-50',
      name: 'level-50',
      component: ElinaHappy,
    },
  ],
})

export default router