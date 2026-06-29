import { WhiteboxCatalogItem, WhiteboxPolicy, WhiteboxRule } from '@/lib/types'

// Policy badge colors grouped by family: forbid = rose, require = emerald, numeric limit = amber.
export const POLICY_BADGE_CLASS: Record<WhiteboxPolicy, string> = {
  FORBID: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  FORBID_ANY:
    'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  REQUIRE:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  REQUIRE_ANY:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  REQUIRE_ALL:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  AT_MOST:
    'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  AT_LEAST:
    'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  EXACTLY:
    'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
}

// One SQL feature and the policies the teacher can apply to it (the catalog entries sharing featureId).
export interface FeatureOption {
  featureId: string
  featureLabel: string
  group: string
  policies: WhiteboxCatalogItem[]
}

export interface FeatureGroup {
  key: string
  features: FeatureOption[]
}

// Build the feature-first add-rule view model: catalog -> groups -> features -> available policies.
// Already-configured rule_ids are excluded; insertion order (backend order) is preserved.
export function buildFeatureGroups(
  catalog: WhiteboxCatalogItem[],
  configuredIds: Set<string>,
  search: string
): FeatureGroup[] {
  const term = search.trim().toLowerCase()
  const groups: FeatureGroup[] = []
  const groupIdx = new Map<string, number>()
  const featureByKey = new Map<string, FeatureOption>()

  for (const item of catalog) {
    if (configuredIds.has(item.ruleId)) continue
    if (term) {
      const haystack =
        `${item.featureLabel} ${item.policyLabel} ${item.label} ${item.ruleId}`.toLowerCase()
      if (!haystack.includes(term)) continue
    }

    let gi = groupIdx.get(item.group)
    if (gi === undefined) {
      gi = groups.length
      groupIdx.set(item.group, gi)
      groups.push({ key: item.group, features: [] })
    }

    const featureKey = `${item.group}|${item.featureId}`
    let feature = featureByKey.get(featureKey)
    if (!feature) {
      feature = {
        featureId: item.featureId,
        featureLabel: item.featureLabel,
        group: item.group,
        policies: []
      }
      featureByKey.set(featureKey, feature)
      groups[gi].features.push(feature)
    }
    feature.policies.push(item)
  }

  return groups
}

// Teacher-facing Action/Type families. The modal offers these generic actions instead of concrete
// backend rule labels; (feature + action [+ operator]) resolves to one supported catalog ruleId.
export type WhiteboxActionKey = 'FORBID' | 'REQUIRE' | 'LIMIT'

export const ACTION_LABEL: Record<WhiteboxActionKey, string> = {
  FORBID: 'Cấm',
  REQUIRE: 'Bắt buộc',
  LIMIT: 'Giới hạn'
}

export const ACTION_HINT: Record<WhiteboxActionKey, string> = {
  FORBID: 'Không cho phép dùng cấu trúc này',
  REQUIRE: 'Bắt buộc phải dùng cấu trúc này',
  LIMIT: 'Giới hạn số lần / độ sâu cho phép'
}

// Map a backend policy onto its teacher-facing action family.
export function policyAction(policy: WhiteboxPolicy): WhiteboxActionKey {
  switch (policy) {
    case 'FORBID':
    case 'FORBID_ANY':
      return 'FORBID'
    case 'AT_MOST':
    case 'AT_LEAST':
    case 'EXACTLY':
      return 'LIMIT'
    default:
      return 'REQUIRE'
  }
}

// Match/operator-mode label derived from the policy; undefined for plain FORBID/REQUIRE
// (boolean features carrying no match mode). Shown as an informational chip and, when an
// action maps to >1 policy, used as the operator sub-choice label.
export const OPERATOR_LABEL: Partial<Record<WhiteboxPolicy, string>> = {
  FORBID_ANY: 'bất kỳ',
  REQUIRE_ANY: 'bất kỳ',
  REQUIRE_ALL: 'tất cả',
  AT_MOST: 'tối đa',
  AT_LEAST: 'tối thiểu',
  EXACTLY: 'chính xác'
}

export interface FeatureActionGroup {
  actionKey: WhiteboxActionKey
  actionLabel: string
  // Catalog entries available for this action on this feature, in backend order. Usually one;
  // >1 means the modal renders an operator sub-choice to disambiguate before resolving the ruleId.
  options: WhiteboxCatalogItem[]
}

// Group a feature's available policies into Action/Type families (Cấm / Bắt buộc / Giới hạn),
// preserving backend order. Drives the generic action picker so concrete rule labels stay hidden.
export function buildFeatureActions(
  feature: FeatureOption
): FeatureActionGroup[] {
  const groups: FeatureActionGroup[] = []
  const idx = new Map<WhiteboxActionKey, number>()
  for (const item of feature.policies) {
    const key = policyAction(item.policy)
    let gi = idx.get(key)
    if (gi === undefined) {
      gi = groups.length
      idx.set(key, gi)
      groups.push({
        actionKey: key,
        actionLabel: ACTION_LABEL[key],
        options: []
      })
    }
    groups[gi].options.push(item)
  }
  return groups
}

export interface WhiteboxConflict {
  labelA: string
  labelB: string
}

export function normalizeWhiteboxRulePenalty(
  rule: WhiteboxRule,
  item?: WhiteboxCatalogItem | null
): WhiteboxRule {
  if (rule.severity === 'WARNING_ONLY') {
    return {
      ...rule,
      penalty_value: 0,
      penalty_unit: 'ABSOLUTE'
    }
  }

  const currentPenalty = Number(rule.penalty_value)
  const defaultPenalty = Number(item?.defaultPenaltyValue)
  return {
    ...rule,
    penalty_value:
      Number.isFinite(currentPenalty) && currentPenalty > 0
        ? currentPenalty
        : Number.isFinite(defaultPenalty) && defaultPenalty > 0
          ? defaultPenalty
          : 0.25,
    penalty_unit:
      rule.penalty_unit ?? item?.defaultPenaltyUnit ?? 'PERCENTAGE_OF_QUESTION'
  }
}

// Detect contradictory configured rules from catalog conflictsWith metadata, plus the param-aware
// MAX_JOIN_COUNT=0 vs REQUIRED_JOIN case the static metadata cannot express. Warn only — never mutate.
export function detectConflicts(
  rules: WhiteboxRule[],
  catalogById: Map<string, WhiteboxCatalogItem>
): WhiteboxConflict[] {
  const configured = new Set(rules.map((r) => r.rule_id))
  const conflicts: WhiteboxConflict[] = []
  const seen = new Set<string>()

  const describe = (ruleId: string): string => {
    const item = catalogById.get(ruleId)
    return item ? `${item.featureLabel} · ${item.policyLabel}` : ruleId
  }

  for (const rule of rules) {
    const item = catalogById.get(rule.rule_id)
    if (!item) continue
    for (const other of item.conflictsWith ?? []) {
      if (!configured.has(other)) continue
      const key = [rule.rule_id, other].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      conflicts.push({
        labelA: describe(rule.rule_id),
        labelB: describe(other)
      })
    }
  }

  const maxJoinRule = rules.find((r) => r.rule_id === 'MAX_JOIN_COUNT')
  if (maxJoinRule && configured.has('REQUIRED_JOIN')) {
    const max = Number(maxJoinRule.params?.max_joins ?? NaN)
    const key = 'MAX_JOIN_COUNT|REQUIRED_JOIN'
    if (max === 0 && !seen.has(key)) {
      seen.add(key)
      conflicts.push({
        labelA: `${describe('MAX_JOIN_COUNT')} = 0`,
        labelB: describe('REQUIRED_JOIN')
      })
    }
  }

  return conflicts
}

// Catalog group display labels for the add-rule modal sections.
export const GROUP_LABELS: Record<string, string> = {
  KEYS: 'Khóa',
  CONSTRAINTS: 'Ràng buộc',
  COLUMNS: 'Cột',
  DATA_TYPE: 'Kiểu dữ liệu',
  SAFETY: 'An toàn DDL',
  // SELECT_QUERY groups
  SUBQUERY_CTE: 'Subquery & CTE',
  JOIN: 'JOIN',
  SELECT_LIST: 'SELECT list & DISTINCT',
  AGGREGATE: 'Aggregate · GROUP BY · HAVING',
  ORDER_WINDOW: 'ORDER BY & Window',
  SET_OPERATION: 'Toán tử tập hợp',
  GENERIC: 'Hàm & từ khóa',
  // FUNCTION groups
  RETURN: 'Return & kiểu trả về',
  OPTIONS: 'Tùy chọn hàm',
  DETERMINISM: 'Tính xác định',
  DML: 'DML bên trong hàm',
  // STORED_PROCEDURE groups
  ERROR_HANDLING: 'Xử lý lỗi',
  TRANSACTION: 'Transaction',
  SETTINGS: 'Cài đặt thực thi',
  VALIDATION: 'Kiểm tra đầu vào',
  PARAMETERS: 'Tham số',
  DDL: 'DDL bên trong SP',
  DEBUG: 'Debug / thông báo',
  // Shared (FUNCTION + SP)
  CURSOR: 'Cursor',
  DYNAMIC_SQL: 'Dynamic SQL'
}

// Build the stored WhiteboxRule from a catalog entry using its suggested severity/penalty/params.
// Stable rule_id contract — same shape the direct catalog add produced.
export function defaultRuleFromCatalog(
  item: WhiteboxCatalogItem
): WhiteboxRule {
  const params: Record<string, unknown> = {}
  for (const spec of item.params) {
    if (spec.type === 'NUMBER' && typeof spec.defaultValue === 'number') {
      params[spec.name] = spec.defaultValue
    } else if (spec.type === 'STRING_LIST') {
      params[spec.name] = []
    }
  }
  return {
    rule_id: item.ruleId,
    enabled: true,
    type: item.type,
    penalty_value: item.defaultPenaltyValue,
    penalty_unit: item.defaultPenaltyUnit,
    severity: item.defaultSeverity,
    description: item.label,
    params
  }
}

// True when every required catalog param has a usable value (NUMBER finite, STRING_LIST non-empty).
export function requiredParamsSatisfied(
  item: WhiteboxCatalogItem,
  params: Record<string, unknown>
): boolean {
  return item.params.every((spec) => {
    if (!spec.required) return true
    const value = params[spec.name]
    if (spec.type === 'NUMBER') return Number.isFinite(Number(value))
    if (spec.type === 'STRING_LIST')
      return Array.isArray(value) && value.length > 0
    return true
  })
}
