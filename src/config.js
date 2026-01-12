export const baseConfig = {
  height:     { label: "Зріст", isFat: false, defaultEnabled: true },
  weight:     { label: "Вага", isFat: true, defaultEnabled: true },
  neck:       { label: "Шия", isFat: false, defaultEnabled: false },
  shoulders:  { label: "Плечі", isFat: false, defaultEnabled: false },
  chest:      { label: "Груди", isFat: false, defaultEnabled: true },
  belly:      { label: "Живіт", isFat: true, defaultEnabled: true },
  waist:      { label: "Талія", isFat: true, defaultEnabled: true },
  hips:       { label: "Сідниці", isFat: false, defaultEnabled: true },
  
  // Групи кінцівок
  biceps:     { label: "Біцепс", isFat: false, defaultEnabled: true, group: 'arms' },
  biceps_r:   { label: "Біцепс (П)", isFat: false, group: 'arms', side: 'right' },
  biceps_l:   { label: "Біцепс (Л)", isFat: false, group: 'arms', side: 'left' },

  wrist:      { label: "Кість", isFat: false, defaultEnabled: true, group: 'wrists' },
  wrist_r:    { label: "Кість (П)", isFat: false, group: 'wrists', side: 'right' },
  wrist_l:    { label: "Кість (Л)", isFat: false, group: 'wrists', side: 'left' },

  thigh:      { label: "Стегно", isFat: false, defaultEnabled: true, group: 'thighs' },
  thigh_r:    { label: "Стегно (П)", isFat: false, group: 'thighs', side: 'right' },
  thigh_l:    { label: "Стегно (Л)", isFat: false, group: 'thighs', side: 'left' },

  calf:       { label: "Гомілка", isFat: false, defaultEnabled: true, group: 'calves' },
  calf_r:     { label: "Гомілка (П)", isFat: false, group: 'calves', side: 'right' },
  calf_l:     { label: "Гомілка (Л)", isFat: false, group: 'calves', side: 'left' },
};