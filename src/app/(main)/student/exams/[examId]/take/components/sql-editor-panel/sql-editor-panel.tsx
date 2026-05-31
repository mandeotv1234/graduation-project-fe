'use client'

import { Play, Loader2, RotateCcw } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import Editor from '@monaco-editor/react'
import type { Monaco } from '@monaco-editor/react'
import type * as monacoType from 'monaco-editor'
import { useTheme } from 'next-themes'
import styles from '@/app/(main)/student/exams/[examId]/take/components/sql-editor-panel/sql-editor-panel.module.scss'

// ─── Schema shape passed from parent ─────────────────────────────────
export interface SchemaTable {
  tableName: string
  columns: { name: string; type: string }[]
}

export interface RoutineSuggestion {
  routineName: string
  routineType: string
  dataType?: string
}

interface SqlEditorPanelProps {
  value: string
  onChange: (value: string) => void
  onExecute: () => void
  /** Called when user runs only the selected text. Receives the selected snippet. */
  onExecuteSelected?: (selectedSql: string) => void
  onClearSchema?: () => void
  isLoading: boolean
  isClearing?: boolean
  /** Optional schema extracted from ExamSpecification for IntelliSense */
  schema?: SchemaTable[]
  routines?: RoutineSuggestion[]
}

export function SqlEditorPanel({
  value,
  onChange,
  onExecute,
  onExecuteSelected,
  onClearSchema,
  isLoading,
  isClearing = false,
  schema = [],
  routines = []
}: SqlEditorPanelProps) {
  const isDev = process.env.NEXT_PUBLIC_ENV === 'development'
  const { resolvedTheme } = useTheme()
  const [editorLoading, setEditorLoading] = useState(true)
  const [selectedText, setSelectedText] = useState('')
  const editorRef = useRef<monacoType.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const completionDisposable = useRef<monacoType.IDisposable | null>(null)

  // Keep latest schema and routines in refs so the Monaco provider closure always sees the freshest data
  const schemaRef = useRef(schema)
  const routinesRef = useRef(routines)
  schemaRef.current = schema
  routinesRef.current = routines

  // ─── Register completion provider on beforeMount ────────────────
  const handleBeforeMount = (monaco: Monaco) => {
    monacoRef.current = monaco
    // Dispose previous provider if any (e.g. hot-reload)
    completionDisposable.current?.dispose()

    completionDisposable.current =
      monaco.languages.registerCompletionItemProvider('sql', {
        // ── KEY FIX: include every word character as a trigger character.
        // When a character IS in triggerCharacters, Monaco ALWAYS calls
        // provideCompletionItems fresh on that keystroke – bypassing the
        // quickSuggestions debounce/cache path that caused suggestions to
        // appear only on backspace (not on forward typing).
        triggerCharacters: [
          '.',
          '(',
          '_',
          'a',
          'b',
          'c',
          'd',
          'e',
          'f',
          'g',
          'h',
          'i',
          'j',
          'k',
          'l',
          'm',
          'n',
          'o',
          'p',
          'q',
          'r',
          's',
          't',
          'u',
          'v',
          'w',
          'x',
          'y',
          'z',
          'A',
          'B',
          'C',
          'D',
          'E',
          'F',
          'G',
          'H',
          'I',
          'J',
          'K',
          'L',
          'M',
          'N',
          'O',
          'P',
          'Q',
          'R',
          'S',
          'T',
          'U',
          'V',
          'W',
          'X',
          'Y',
          'Z',
          '0',
          '1',
          '2',
          '3',
          '4',
          '5',
          '6',
          '7',
          '8',
          '9'
        ],

        provideCompletionItems(
          model: monacoType.editor.ITextModel,
          position: monacoType.Position
        ): monacoType.languages.CompletionList {
          const word = model.getWordUntilPosition(position)

          // Use word.endColumn (documented standard) as the range end.
          // Trigger-character calls always pass the fresh cursor position
          // so the range is always computed fresh – no stale cache.
          const range: monacoType.IRange = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
          }

          const lineText = model.getLineContent(position.lineNumber)
          const textBeforeWord = lineText.substring(0, word.startColumn - 1)
          const dotMatch = textBeforeWord.match(/(\w+)\.$/)

          const suggestions: monacoType.languages.CompletionItem[] = []
          const CIK = monaco.languages.CompletionItemKind
          const CIT = monaco.languages.CompletionItemInsertTextRule

          // Parse full text to find table aliases (FROM tableName alias)
          const fullText = model.getValue().toLowerCase()
          const aliasMap = new Map<string, string>()
          const aliasMatches = fullText.matchAll(
            /(?:from|join)\s+([a-z0-9_]+)(?:\s+(?:as\s+)?([a-z0-9_]+))?/g
          )
          for (const m of aliasMatches) {
            const tbl = m[1]
            const alias = m[2]
            if (
              alias &&
              ![
                'where',
                'on',
                'join',
                'inner',
                'left',
                'right',
                'full',
                'cross',
                'order',
                'group',
                'having',
                'limit'
              ].includes(alias)
            ) {
              aliasMap.set(alias, tbl)
            } else if (!alias) {
              aliasMap.set(tbl, tbl)
            }
          }

          const currentSchema = schemaRef.current || []
          const currentRoutines = routinesRef.current || []

          // ── 1. Dot-access → column suggestions for the resolved table/alias ──
          if (dotMatch) {
            const prefix = dotMatch[1].toLowerCase()
            const mappedTable = aliasMap.get(prefix)
            const matched = currentSchema.find(
              (t) =>
                (mappedTable && t.tableName.toLowerCase() === mappedTable) ||
                t.tableName.toLowerCase() === prefix ||
                t.tableName.toLowerCase().startsWith(prefix)
            )
            if (matched) {
              matched.columns.forEach((col) => {
                suggestions.push({
                  label: col.name,
                  kind: CIK.Field,
                  detail: `${matched.tableName}.${col.name}  —  ${col.type}`,
                  documentation: {
                    value: `**${col.name}** (\`${col.type}\`) từ bảng \`${matched.tableName}\``
                  },
                  insertText: col.name,
                  range
                })
              })
              return { suggestions, incomplete: true }
            }
          }

          // ── 2. Table names ──────────────────────────────────────────────
          currentSchema.forEach((table) => {
            suggestions.push({
              label: table.tableName,
              kind: CIK.Class,
              detail: `Bảng  (${table.columns.length} cột)`,
              documentation: {
                value:
                  `**${table.tableName}**\n\n` +
                  table.columns
                    .map((c) => `- \`${c.name}\`  ${c.type}`)
                    .join('\n')
              },
              insertText: table.tableName,
              sortText: `a_${table.tableName}`,
              range
            })
          })

          // ── 3. Stored Procedures & Functions ───────────────────────────
          currentRoutines.forEach((routine) => {
            const isProc = routine.routineType?.toUpperCase() === 'PROCEDURE'
            const kind = isProc ? CIK.Method : CIK.Function
            const detailLabel = isProc
              ? 'Stored Procedure'
              : `Function → ${routine.dataType || 'N/A'}`
            suggestions.push({
              label: routine.routineName,
              kind,
              detail: detailLabel,
              documentation: {
                value: `**${routine.routineName}**\n\n${detailLabel}`
              },
              insertText: `${routine.routineName}($0)`,
              insertTextRules: CIT.InsertAsSnippet,
              sortText: `b_${routine.routineName}`,
              range
            })
          })

          // ── 4. Column names (all tables, de-duped) ─────────────────────
          const seenCols = new Set<string>()
          currentSchema.forEach((table) => {
            table.columns.forEach((col) => {
              if (seenCols.has(col.name)) return
              seenCols.add(col.name)
              suggestions.push({
                label: col.name,
                kind: CIK.Field,
                detail: `Cột  ${col.type}  (${table.tableName})`,
                insertText: col.name,
                sortText: `c_${col.name}`,
                range
              })
            })
          })

          // ── 5. SQL keyword snippets ────────────────────────────────────
          const snippets: Array<{
            label: string
            filterText: string // what the user types to find this snippet
            detail: string
            doc: string
            insert: string
          }> = [
            // SELECT
            {
              label: 'SELECT',
              filterText: 'SELECT',
              detail: 'SELECT – truy vấn dữ liệu',
              doc: 'Truy vấn dữ liệu từ một hoặc nhiều bảng',
              insert: 'SELECT ${1:*} FROM ${2:table_name}'
            },
            {
              label: 'SELECT ... WHERE',
              filterText: 'SELECT WHERE',
              detail: 'SELECT với điều kiện WHERE',
              doc: 'Truy vấn dữ liệu có lọc điều kiện',
              insert:
                'SELECT ${1:*}\nFROM ${2:table_name}\nWHERE ${3:condition}'
            },
            {
              label: 'SELECT DISTINCT',
              filterText: 'SELECT DISTINCT',
              detail: 'SELECT DISTINCT – loại bỏ trùng lặp',
              doc: 'Truy vấn dữ liệu không trùng lặp',
              insert: 'SELECT DISTINCT ${1:column}\nFROM ${2:table_name}'
            },
            {
              label: 'SELECT ... ORDER BY',
              filterText: 'SELECT ORDER',
              detail: 'SELECT với ORDER BY',
              doc: 'Truy vấn và sắp xếp kết quả',
              insert:
                'SELECT ${1:*}\nFROM ${2:table_name}\nORDER BY ${3:column} ${4|ASC,DESC|}'
            },
            {
              label: 'SELECT ... GROUP BY',
              filterText: 'SELECT GROUP',
              detail: 'SELECT với GROUP BY',
              doc: 'Truy vấn tổng hợp theo nhóm',
              insert:
                'SELECT ${1:column}, ${2:COUNT(*)} AS ${3:count}\nFROM ${4:table_name}\nGROUP BY ${1:column}'
            },
            {
              label: 'SELECT ... HAVING',
              filterText: 'SELECT HAVING',
              detail: 'SELECT với GROUP BY ... HAVING',
              doc: 'Truy vấn nhóm có điều kiện lọc',
              insert:
                'SELECT ${1:column}, ${2:COUNT(*)} AS ${3:count}\nFROM ${4:table_name}\nGROUP BY ${1:column}\nHAVING ${5:COUNT(*)} > ${6:1}'
            },
            // JOIN
            {
              label: 'INNER JOIN',
              filterText: 'INNER JOIN',
              detail: 'INNER JOIN – kết hợp bảng',
              doc: 'Kết hợp các hàng khớp từ hai bảng',
              insert:
                'SELECT ${1:*}\nFROM ${2:table1} t1\nINNER JOIN ${3:table2} t2 ON t1.${4:id} = t2.${5:fk_id}'
            },
            {
              label: 'LEFT JOIN',
              filterText: 'LEFT JOIN',
              detail: 'LEFT JOIN – kết hợp bên trái',
              doc: 'Trả về tất cả hàng bảng trái, kể cả không khớp',
              insert:
                'SELECT ${1:*}\nFROM ${2:table1} t1\nLEFT JOIN ${3:table2} t2 ON t1.${4:id} = t2.${5:fk_id}'
            },
            {
              label: 'RIGHT JOIN',
              filterText: 'RIGHT JOIN',
              detail: 'RIGHT JOIN – kết hợp bên phải',
              doc: 'Trả về tất cả hàng bảng phải, kể cả không khớp',
              insert:
                'SELECT ${1:*}\nFROM ${2:table1} t1\nRIGHT JOIN ${3:table2} t2 ON t1.${4:id} = t2.${5:fk_id}'
            },
            {
              label: 'FULL OUTER JOIN',
              filterText: 'FULL OUTER JOIN',
              detail: 'FULL OUTER JOIN – kết hợp đầy đủ',
              doc: 'Trả về tất cả hàng từ cả hai bảng',
              insert:
                'SELECT ${1:*}\nFROM ${2:table1} t1\nFULL OUTER JOIN ${3:table2} t2 ON t1.${4:id} = t2.${5:fk_id}'
            },
            // INSERT
            {
              label: 'INSERT INTO',
              filterText: 'INSERT INTO',
              detail: 'INSERT INTO – chèn dữ liệu',
              doc: 'Chèn một hàng mới vào bảng',
              insert:
                "INSERT INTO ${1:table_name} (${2:col1}, ${3:col2})\nVALUES (${4:'val1'}, ${5:'val2'})"
            },
            {
              label: 'INSERT INTO ... SELECT',
              filterText: 'INSERT SELECT',
              detail: 'INSERT INTO ... SELECT',
              doc: 'Chèn dữ liệu từ kết quả truy vấn',
              insert:
                'INSERT INTO ${1:table_name} (${2:col1}, ${3:col2})\nSELECT ${2:col1}, ${3:col2}\nFROM ${4:source_table}\nWHERE ${5:condition}'
            },
            // UPDATE
            {
              label: 'UPDATE',
              filterText: 'UPDATE',
              detail: 'UPDATE – cập nhật dữ liệu',
              doc: 'Cập nhật các hàng trong bảng',
              insert:
                "UPDATE ${1:table_name}\nSET ${2:column} = ${3:'value'}\nWHERE ${4:condition}"
            },
            // DELETE
            {
              label: 'DELETE FROM',
              filterText: 'DELETE FROM',
              detail: 'DELETE FROM – xóa dữ liệu',
              doc: 'Xóa các hàng khỏi bảng',
              insert: 'DELETE FROM ${1:table_name}\nWHERE ${2:condition}'
            },
            // CREATE TABLE
            {
              label: 'CREATE TABLE',
              filterText: 'CREATE TABLE',
              detail: 'CREATE TABLE – tạo bảng mới',
              doc: 'Tạo bảng mới trong CSDL',
              insert:
                'CREATE TABLE ${1:table_name} (\n\t${2:id} INT PRIMARY KEY,\n\t${3:column1} ${4:VARCHAR(255)} NOT NULL,\n\t${5:created_at} DATETIME DEFAULT CURRENT_TIMESTAMP\n)'
            },
            {
              label: 'CREATE TABLE IF NOT EXISTS',
              filterText: 'CREATE TABLE IF NOT EXISTS',
              detail: 'CREATE TABLE IF NOT EXISTS',
              doc: 'Tạo bảng nếu chưa tồn tại',
              insert:
                'CREATE TABLE IF NOT EXISTS ${1:table_name} (\n\t${2:id} INT PRIMARY KEY,\n\t${3:column1} ${4:VARCHAR(255)} NOT NULL\n)'
            },
            // ALTER TABLE
            {
              label: 'ALTER TABLE ADD COLUMN',
              filterText: 'ALTER TABLE ADD COLUMN',
              detail: 'ALTER TABLE – thêm cột',
              doc: 'Thêm cột mới vào bảng đã có',
              insert:
                'ALTER TABLE ${1:table_name}\nADD COLUMN ${2:column_name} ${3:VARCHAR(255)}'
            },
            {
              label: 'ALTER TABLE ADD CONSTRAINT',
              filterText: 'ALTER TABLE ADD CONSTRAINT',
              detail: 'ALTER TABLE – thêm FOREIGN KEY',
              doc: 'Thêm khóa ngoại vào bảng',
              insert:
                'ALTER TABLE ${1:table_name}\nADD CONSTRAINT ${2:fk_name}\nFOREIGN KEY (${3:column}) REFERENCES ${4:ref_table}(${5:ref_column})'
            },
            // DROP
            {
              label: 'DROP TABLE',
              filterText: 'DROP TABLE',
              detail: 'DROP TABLE – xóa bảng',
              doc: 'Xóa bảng và toàn bộ dữ liệu',
              insert: 'DROP TABLE ${1|IF EXISTS,|} ${2:table_name}'
            },
            // Aggregates
            {
              label: 'COUNT(*)',
              filterText: 'COUNT',
              detail: 'COUNT(*) – đếm số hàng',
              doc: 'Đếm tổng số hàng trong kết quả',
              insert: 'COUNT(*)'
            },
            {
              label: 'COUNT(column)',
              filterText: 'COUNT',
              detail: 'COUNT(column) – đếm giá trị không NULL',
              doc: 'Đếm số hàng có giá trị không NULL trong cột',
              insert: 'COUNT(${1:column})'
            },
            {
              label: 'SUM',
              filterText: 'SUM',
              detail: 'SUM(column) – tổng',
              doc: 'Tính tổng giá trị cột số',
              insert: 'SUM(${1:column})'
            },
            {
              label: 'AVG',
              filterText: 'AVG',
              detail: 'AVG(column) – trung bình',
              doc: 'Tính trung bình giá trị cột số',
              insert: 'AVG(${1:column})'
            },
            {
              label: 'MAX',
              filterText: 'MAX',
              detail: 'MAX(column) – giá trị lớn nhất',
              doc: 'Lấy giá trị lớn nhất trong cột',
              insert: 'MAX(${1:column})'
            },
            {
              label: 'MIN',
              filterText: 'MIN',
              detail: 'MIN(column) – giá trị nhỏ nhất',
              doc: 'Lấy giá trị nhỏ nhất trong cột',
              insert: 'MIN(${1:column})'
            },
            // Subquery
            {
              label: 'WHERE IN (subquery)',
              filterText: 'WHERE IN',
              detail: 'WHERE IN (SELECT ...)',
              doc: 'Lọc theo tập kết quả của truy vấn con',
              insert:
                'WHERE ${1:column} IN (\n\tSELECT ${2:column}\n\tFROM ${3:table_name}\n\tWHERE ${4:condition}\n)'
            },
            {
              label: 'WHERE EXISTS',
              filterText: 'WHERE EXISTS',
              detail: 'WHERE EXISTS (SELECT ...)',
              doc: 'Lọc khi truy vấn con trả về ít nhất một hàng',
              insert:
                'WHERE EXISTS (\n\tSELECT 1\n\tFROM ${1:table_name}\n\tWHERE ${2:condition}\n)'
            },
            // CASE
            {
              label: 'CASE WHEN',
              filterText: 'CASE WHEN',
              detail: 'CASE WHEN ... THEN ... END',
              doc: 'Biểu thức điều kiện trong SQL',
              insert:
                'CASE\n\tWHEN ${1:condition} THEN ${2:result}\n\tWHEN ${3:condition2} THEN ${4:result2}\n\tELSE ${5:default_result}\nEND'
            },
            // Stored procedure / function
            {
              label: 'CREATE PROCEDURE',
              filterText: 'CREATE PROCEDURE',
              detail: 'CREATE PROCEDURE – tạo thủ tục',
              doc: 'Tạo stored procedure mới',
              insert:
                'DELIMITER $$\nCREATE PROCEDURE ${1:proc_name}(${2:IN param1 INT})\nBEGIN\n\t${3:-- body}\nEND$$\nDELIMITER ;'
            },
            {
              label: 'CREATE FUNCTION',
              filterText: 'CREATE FUNCTION',
              detail: 'CREATE FUNCTION – tạo hàm',
              doc: 'Tạo hàm SQL mới',
              insert:
                'DELIMITER $$\nCREATE FUNCTION ${1:func_name}(${2:param1 INT})\nRETURNS ${3:INT}\nDETERMINISTIC\nBEGIN\n\t${4:RETURN 0;}\nEND$$\nDELIMITER ;'
            },
            {
              label: 'CREATE TRIGGER',
              filterText: 'CREATE TRIGGER',
              detail: 'CREATE TRIGGER – tạo trigger',
              doc: 'Tạo trigger tự động kích hoạt',
              insert:
                'DELIMITER $$\nCREATE TRIGGER ${1:trigger_name}\n${2|BEFORE,AFTER|} ${3|INSERT,UPDATE,DELETE|} ON ${4:table_name}\nFOR EACH ROW\nBEGIN\n\t${5:-- body}\nEND$$\nDELIMITER ;'
            },
            // Common keywords
            {
              label: 'WHERE',
              filterText: 'WHERE',
              detail: 'WHERE – điều kiện lọc',
              doc: 'Thêm điều kiện lọc vào câu truy vấn',
              insert: 'WHERE ${1:condition}'
            },
            {
              label: 'ORDER BY',
              filterText: 'ORDER BY',
              detail: 'ORDER BY – sắp xếp',
              doc: 'Sắp xếp kết quả theo cột',
              insert: 'ORDER BY ${1:column} ${2|ASC,DESC|}'
            },
            {
              label: 'GROUP BY',
              filterText: 'GROUP BY',
              detail: 'GROUP BY – gom nhóm',
              doc: 'Gom nhóm kết quả theo cột',
              insert: 'GROUP BY ${1:column}'
            },
            {
              label: 'HAVING',
              filterText: 'HAVING',
              detail: 'HAVING – điều kiện sau GROUP BY',
              doc: 'Lọc kết quả sau khi gom nhóm',
              insert: 'HAVING ${1:condition}'
            },
            {
              label: 'LIMIT',
              filterText: 'LIMIT',
              detail: 'LIMIT – giới hạn số hàng',
              doc: 'Giới hạn số hàng trả về',
              insert: 'LIMIT ${1:10}'
            },
            {
              label: 'OFFSET',
              filterText: 'OFFSET',
              detail: 'OFFSET – phân trang',
              doc: 'Bỏ qua N hàng đầu tiên',
              insert: 'OFFSET ${1:0}'
            },
            {
              label: 'LIKE',
              filterText: 'LIKE',
              detail: 'LIKE – tìm kiếm mẫu chuỗi',
              doc: 'Tìm kiếm chuỗi theo mẫu ký tự đại diện',
              insert: "LIKE '${1:%pattern%}'"
            },
            {
              label: 'BETWEEN',
              filterText: 'BETWEEN',
              detail: 'BETWEEN – trong khoảng',
              doc: 'Lọc giá trị nằm trong khoảng chỉ định',
              insert: 'BETWEEN ${1:value1} AND ${2:value2}'
            },
            {
              label: 'IS NULL',
              filterText: 'IS NULL',
              detail: 'IS NULL – kiểm tra null',
              doc: 'Kiểm tra giá trị NULL',
              insert: 'IS NULL'
            },
            {
              label: 'IS NOT NULL',
              filterText: 'IS NOT NULL',
              detail: 'IS NOT NULL – không phải null',
              doc: 'Kiểm tra giá trị không phải NULL',
              insert: 'IS NOT NULL'
            }
          ]

          snippets.forEach(({ label, detail, doc, insert }) => {
            suggestions.push({
              label,
              kind: CIK.Keyword,
              detail,
              documentation: { value: doc },
              insertText: insert,
              insertTextRules: CIT.InsertAsSnippet,
              sortText: `z_${label}`,
              range
            })
          })

          return { suggestions, incomplete: true }
        }
      })
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        {onClearSchema && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={isLoading || isClearing}
                className={styles.resetButton}
              >
                {isClearing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                Xoá sạch DB
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Xác nhận xoá toàn bộ dữ liệu?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Hành động này sẽ thực thi lệnh xoá toàn bộ Bảng, Thủ tục, Hàm
                  và Trigger trong schema của bạn. Bạn sẽ cần thực thi lại các
                  lệnh CREATE/INSERT để khôi phục cấu trúc.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Huỷ bỏ</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onClearSchema}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Xoá ngay
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <Button
          onClick={() => {
            if (selectedText && onExecuteSelected) {
              onExecuteSelected(selectedText)
            } else {
              onExecute()
            }
          }}
          disabled={isLoading || isClearing}
          className={styles.executeButton}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {isLoading ? 'Đang chạy...' : 'Chạy SQL'}
        </Button>
      </div>

      <div className={styles.editorWrap}>
        {editorLoading && (
          <div className={styles.loadingOverlay}>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        <Editor
          height="100%"
          defaultLanguage="sql"
          theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
          value={value}
          onChange={(val) => onChange(val || '')}
          beforeMount={handleBeforeMount}
          onMount={(editor) => {
            editorRef.current = editor
            setEditorLoading(false)

            // Track text selection to enable "Run selected" button
            editor.onDidChangeCursorSelection(() => {
              const selection = editor.getSelection()
              if (!selection || selection.isEmpty()) {
                setSelectedText('')
                return
              }
              const text = editor.getModel()?.getValueInRange(selection) || ''
              setSelectedText(text.trim())
            })

            // Ctrl+Enter / Cmd+Enter → run selected or all
            const monaco = monacoRef.current
            if (monaco) {
              editor.addCommand(
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
                () => {
                  const sel = editorRef.current?.getSelection()
                  const selText =
                    sel && !sel.isEmpty()
                      ? editorRef.current?.getModel()?.getValueInRange(sel) ||
                        ''
                      : ''
                  if (selText.trim() && onExecuteSelected) {
                    onExecuteSelected(selText.trim())
                  } else {
                    onExecute()
                  }
                }
              )
            }

            if (!isDev) {
              // Disable Monaco's own context menu
              editor.updateOptions({ contextmenu: false })
              // Also block browser-level right-click on the DOM node
              const editorDom = editor.getDomNode()
              if (editorDom) {
                editorDom.addEventListener('contextmenu', (e) =>
                  e.preventDefault()
                )
                editorDom.addEventListener('mousedown', (e: MouseEvent) => {
                  if (e.button === 2) e.preventDefault()
                })
              }
            }
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            // IntelliSense fires on every keystroke (no need to press Ctrl+Space)
            quickSuggestions: { other: true, comments: false, strings: false },
            quickSuggestionsDelay: 10,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            wordBasedSuggestions: 'off',
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showClasses: true,
              showFields: true,
              snippetsPreventQuickSuggestions: false,
              filterGraceful: true,
              // Show preview of snippet inline as ghost text
              preview: true
            },
            parameterHints: { enabled: true }
          }}
        />
      </div>
    </div>
  )
}
