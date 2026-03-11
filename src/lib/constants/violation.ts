export enum ViolationType {
  TAB_SWITCH = 'TAB_SWITCHED',
  FULLSCREEN_EXIT = 'FULLSCREEN_EXIT',
  COPY = 'ILLEGAL_COPY',
  PASTE = 'ILLEGAL_PASTE',
  RIGHT_CLICK = 'RIGHT_CLICK',
  DEVTOOLS_OPEN = 'DEVTOOLS_OPENED',
  SHORTCUT_BLOCKED = 'SUSPICIOUS_ACTIVITY'
}

export const VIOLATION_LABELS: Record<ViolationType, string> = {
  [ViolationType.TAB_SWITCH]: 'Chuyển tab / Thu nhỏ trình duyệt',
  [ViolationType.FULLSCREEN_EXIT]: 'Thoát chế độ toàn màn hình',
  [ViolationType.COPY]: 'Sao chép nội dung',
  [ViolationType.PASTE]: 'Dán nội dung từ bên ngoài',
  [ViolationType.RIGHT_CLICK]: 'Nhấp chuột phải',
  [ViolationType.DEVTOOLS_OPEN]: 'Mở DevTools',
  [ViolationType.SHORTCUT_BLOCKED]: 'Hoạt động đáng ngờ'
}

export const VIOLATION_SEVERITY: Record<
  ViolationType,
  'low' | 'medium' | 'high'
> = {
  [ViolationType.TAB_SWITCH]: 'medium',
  [ViolationType.FULLSCREEN_EXIT]: 'medium',
  [ViolationType.COPY]: 'low',
  [ViolationType.PASTE]: 'high',
  [ViolationType.RIGHT_CLICK]: 'low',
  [ViolationType.DEVTOOLS_OPEN]: 'high',
  [ViolationType.SHORTCUT_BLOCKED]: 'low'
}

export const MAX_VIOLATIONS_BEFORE_WARNING = 2
export const MAX_VIOLATIONS_BEFORE_SUBMIT = 3
