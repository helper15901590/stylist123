
/**
 * 性别枚举定义
 */
export enum Gender {
  Male = 'MALE',    // 男士
  Female = 'FEMALE',  // 女士
  Child = 'CHILD'   // 儿童
}

/**
 * 预设模特接口定义
 */
export interface PresetModel {
  id: string;       // 唯一标识
  name: string;     // 名称
  gender: Gender;   // 性别
  imageUrl: string; // 照片链接
  description: string; // 描述
}

/**
 * 衣物分类类型定义
 */
export type ClothingCategory = 
  | 'HEADWEAR'   // 头饰
  | 'EARRINGS'   // 耳饰
  | 'NECKLACE'   // 项链
  | 'OUTERWEAR'  // 外套
  | 'TOP'        // 上衣
  | 'BOTTOM'     // 下装
  | 'BAG'        // 包包
  | 'SHOES'      // 鞋子
  | 'HAND_ACC';  // 手饰/手表

/**
 * 单个衣物项接口
 */
export interface ClothingItem {
  id: string;
  type: ClothingCategory;
  imageUrl: string;
  name: string;
}

/**
 * 场景接口定义
 */
export interface Scenario {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
}

/**
 * 整体搭配状态接口
 */
export interface TryOnState {
  baseImage: string | null;                     // 模特底图
  items: Partial<Record<ClothingCategory, string>>; // 各分类下的衣物图（Base64）
  scenario: string | null;                      // 场景图（Base64）
}
