import { createRouter, createWebHistory } from 'vue-router'

import StartView from '../views/StartView.vue'
import Levels from '../views/Levels.vue'
import AlgorithmRoom from '../views/AlgorithmRoom.vue'
import AlignRoom from '../views/AlignRoom.vue'
import AntennaRoom from '../views/AntennaRoom.vue'
import AntiVirus from '../views/AntiVirus.vue'
import BatBar from '../views/BatBar.vue'
import BlockEscape from '../views/BlockEscape.vue'
import ElinarichardHeist_omgjord from '../views/ElinarichardHeist_omgjord.vue'
import ElinaHappy from '../views/ElinaHappy.vue'
import FogNavigationRoom from '../views/FogNavigationRoom.vue'
import CipherRoom from '../views/CipherRoom.vue'
import Hallon from '../views/Hallon.vue'
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
import SevenElevenEscape from '../views/SevenElevenEscape.vue'
import Stjarnvaktaren from '../views/Stjarnvaktaren.vue'
import Rules from '../views/Rules.vue'
import PacmanSushiRoom from '../views/PacmanSushiRoom.vue'
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
import Ragebait_elina_game from '../views/ragebait_elina_game.vue'
import BedtimeEscape from '../views/BedtimeEscape.vue'
import Cute_quiz_game_vue from '../views/cute_quiz_game_vue.vue'
import Login from '../views/Login.vue'
import SnackSpeedrun from '../views/SnackSpeedrun.vue'
import OperationRamlosan from '../views/OperationRamlosan.vue'
import Elektrolabb from '../views/elektrolabb.vue'
import plattan from '../views/plattan.vue'


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
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/levels',
      name: 'levels',
      component: Levels,
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
      path: '/level-13',
      name: 'level-13',
      component: SevenElevenEscape,
    },
    {
      path: '/level-14',
      name: 'level-14',
      component: LoadingScreen,
    },
    {
      path: '/level-15',
      name: 'level-15',
      component: Hallon,
    },
    {
      path: '/level-18',
      name: 'level-18',
      component: Stjarnvaktaren,
    },
    { 
      path: '/level-19',
      name: 'level-19',
      component: NavigationRoom,
    },
    {
      path: '/level-20',
      name: 'level-20',
      component: NobelRoom,
    },
    {
      path: '/level-21',
      name: 'level-21',
      component: BatBar,
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
    {
      path: '/level-25',
      name: 'level-25',
      component: Food,
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
    {
      path: '/level-51',
      name: 'level-51',
      component: ElinarichardHeist_omgjord,
    },
    {
      path: '/level-52',
      name: 'level-52',
      component: Ragebait_elina_game,
    },
    {
      path: '/level-53',
      name: 'level-53',
      component: BedtimeEscape,
    },
    {
      path: '/level-54',
      name: 'level-54',
      component: Cute_quiz_game_vue,
    },
    {
      path: '/level-54',
      name: 'level-54',
      component: SnackSpeedrun,
    },
     {path: '/level-55',
      name: 'level-55',
      component: OperationRamlosan,
    },
    {path: '/level-56',
      name: 'level-56',
      component: Elektrolabb,
    },
    {path: '/level-57',
      name: 'level-57',
      component: plattan,
    },



  ],
})

export default router