
import { Gender, PresetModel } from './types';

/**
 * 模特资源配置
 * 包含：女士、男士、儿童三类核心模特，用于提供默认选择
 */
export const PRESET_MODELS: PresetModel[] = [
  {
    id: 'female_core',
    name: '女士',
    gender: Gender.Female,
    imageUrl: '/models/female.jpg',
    description: '核心女性模特'
  },
  {
    id: 'male_core',
    name: '男士',
    gender: Gender.Male,
    imageUrl: '/models/male.jpg',
    description: '核心男性模特'
  },
  {
    id: 'child_core',
    name: '儿童',
    gender: Gender.Child,
    imageUrl: '/models/child.jpg',
    description: '核心儿童模特'
  }
];

// 预留的场景与默认衣物扩展配置
export const PRESET_SCENARIOS = [];
export const DEFAULT_CLOTHING = [];
