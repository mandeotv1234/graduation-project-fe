# Graph Report - graduation-project-fe  (2026-06-16)

## Corpus Check
- 333 files · ~171,792 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1842 nodes · 4791 edges · 95 communities (85 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `78a356cd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 128 edges
2. `Button` - 94 edges
3. `PATH` - 49 edges
4. `useApi()` - 35 edges
5. `formatDateTime()` - 29 edges
6. `ApiClient` - 29 edges
7. `scripts` - 27 edges
8. `DialogContent()` - 25 edges
9. `DialogHeader()` - 25 edges
10. `DialogTitle()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `ExamStatusBadge()` --calls--> `cn()`  [EXTRACTED]
  src/app/(main)/student/exams/components/exam-list/exam-list.tsx → src/lib/utils/cn.ts
- `ResultPanelProps` --references--> `ExecuteSqlResponse`  [EXTRACTED]
  src/app/(main)/student/exams/[examId]/take/components/result-panel/result-panel.tsx → src/lib/types/exam.type.ts
- `KeyIcon()` --calls--> `cn()`  [EXTRACTED]
  src/app/(main)/student/exams/[examId]/take/components/schema-flow/schema-flow.tsx → src/lib/utils/cn.ts
- `SpecificationPanel()` --calls--> `cn()`  [EXTRACTED]
  src/app/(main)/student/exams/[examId]/take/components/specification-panel/specification-panel.tsx → src/lib/utils/cn.ts
- `ExamTakeBottomPanelProps` --references--> `ExecuteSqlResponse`  [EXTRACTED]
  src/app/(main)/student/exams/[examId]/take/components/exam-take-bottom-panel/exam-take-bottom-panel.tsx → src/lib/types/exam.type.ts

## Communities (95 total, 10 thin omitted)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (38): createSpecification(), generateSpecificationSchemaByAI(), generateSpecificationSchemaFromDDL(), updateSpecification(), DatabaseBuilderContext, DatabaseBuilderContextType, DatabaseBuilderProvider(), DatabaseBuilderProviderProps (+30 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (48): dependencies, @azure/msal-browser, @azure/msal-react, class-variance-authority, clsx, date-fns, dompurify, @hookform/resolvers (+40 more)

### Community 3 - "Community 3"
Cohesion: 0.26
Nodes (11): connectListeners, connectStomp(), getStompClient(), subscribeToConnect(), subscribeToDeviceConflict(), subscribeToExamViolations(), subscribeToGradingResult(), subscribeToStudentSession() (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (38): Columns, CreateExamQuestionBatch, CreateRulePresetRequest, CreateTableGradingPayload, GradingSettings, InsertDataColumnConfig, InsertDataExpectedRow, InsertDataGradingPayload (+30 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (34): extractQuestionsFromPdf(), createExamQuestionsBatch(), EXAM_STATUS_CONFIG, ClassTeachersSection(), ClassTeachersSectionProps, CloneExamTemplateDialogProps, ExamMonitorPanelProps, StudentMonitorState (+26 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (51): ACTION_OPTIONS, ALL_TARGET_OPTIONS, buildBroadRuleSignature(), buildFriendlyRuleName(), buildRuleName(), buildRuleSummary(), buildStrictRuleSignature(), buildTargetConditionGuide() (+43 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (32): WhiteboxAddRuleModal(), WhiteboxAddRuleModalProps, ACTION_HINT, ACTION_LABEL, buildFeatureActions(), buildFeatureGroups(), defaultRuleFromCatalog(), detectConflicts() (+24 more)

### Community 8 - "Community 8"
Cohesion: 0.19
Nodes (19): ConflictErrorType, ConflictRow, EditClassPageProps, DatasetTableViewProps, ParsedTableData, CreateClassStudentInfo, Checkbox(), DialogOverlay() (+11 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (16): LoginForm(), ExamBasicInfoProps, ExamDescriptionEditorProps, ExamFileUploadProps, ExamSampleDataTableProps, ExamSchemaEditorProps, useLogin(), GoogleIcon() (+8 more)

### Community 11 - "Community 11"
Cohesion: 0.24
Nodes (5): ResultGroupCard(), ResultGroup, formatScore(), ResultTone, StudentExamResultResponse

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (11): buildCreateTablesFromAnswer(), CONSTRAINT_TYPES, createDefaultRubric(), CreateTableRubricEditor(), CreateTableRubricEditorProps, normalizeCreateTablePayload(), SQL_TYPES, ConstraintType (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.10
Nodes (22): submitFeedback(), SpecificationCreateView(), ExportExamPdfModal(), STEP_ITEMS, EntityDescriptionState, EntityDescriptionStatus, ExportExamPdfModalProps, ExportStep (+14 more)

### Community 14 - "Community 14"
Cohesion: 0.17
Nodes (12): buildInsertScript(), escapeMsIdentifier(), mapDatasetBlocksToSavePayload(), quoteMsIdentifier(), collectTableNames(), ExecuteSqlInExam, ExportDatasetResult, exportDatasetsFromScript() (+4 more)

### Community 15 - "Community 15"
Cohesion: 0.07
Nodes (29): devDependencies, dotenv-cli, eslint, eslint-config-next, eslint-config-prettier, @eslint/eslintrc, @eslint/js, eslint-plugin-prettier (+21 more)

### Community 16 - "Community 16"
Cohesion: 0.12
Nodes (21): addTeacherToClass(), banStudent(), createClass(), createRulePreset(), deleteRulePreset(), dropAllExamSchemas(), getRulePresets(), getTeacherExamSettings() (+13 more)

### Community 17 - "Community 17"
Cohesion: 0.11
Nodes (20): buildInsertTablesFromAnswer(), deleteSpecification(), executeSelectTestCaseConfig(), generateEntityDescription(), getWhiteboxCatalog(), saveExamSpecification(), testGradeSelectData(), updateEntityDescription() (+12 more)

### Community 18 - "Community 18"
Cohesion: 0.26
Nodes (14): ConfirmLeaveDialogProps, ConfirmSubmitDialogProps, RoutineSuggestion, SqlEditorPanelProps, RunTarget, SqlPlaygroundProps, AlertDialogAction, AlertDialogCancel (+6 more)

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (12): buildCreateTableSqlFromDdl(), CreateTableQueryFromSpecProps, CreateTableSpecSource, Entity, EntityAttribute, normalizeTableName(), SchemaColumn, SchemaTable (+4 more)

### Community 20 - "Community 20"
Cohesion: 0.07
Nodes (27): scripts, build, dev, format, lint, lint-staged, postinstall, prepare (+19 more)

### Community 21 - "Community 21"
Cohesion: 0.15
Nodes (8): getMe(), AdminHeader(), TeacherNotificationBell(), CreateExamHeaderProps, ExamHeaderProps, ModeToggle(), StudentHeader(), formatTime()

### Community 22 - "Community 22"
Cohesion: 0.09
Nodes (27): deleteExam(), deleteExamQuestion(), forceSubmitStudentExam(), mockQuestions, remindStudent(), updateExamQuestion(), ClassBansSectionProps, ClassDetailViewProps (+19 more)

### Community 23 - "Community 23"
Cohesion: 0.08
Nodes (23): API Client, Architecture, Auth and Role-Based Routing, Class Utilities, CLAUDE.md — graduation-project-fe, Component Code Order, Component Structure, Constants (+15 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (19): buildChart(), compareHistoryRows(), formatScore(), formatSignedScore(), getImprovementTone(), getStatusConfig(), ProgressSummary, ScoreTrendChart() (+11 more)

### Community 25 - "Community 25"
Cohesion: 0.12
Nodes (16): exportExamPdfBlob(), fetchExamPdfBlobUrl(), parseContentDispositionFilename(), ResultSpecification(), ResultSpecificationProps, CreateExamFormProps, detectRelations(), DT_COLOR (+8 more)

### Community 26 - "Community 26"
Cohesion: 0.47
Nodes (5): getTeacherExamMonitor(), ExamMonitorPanel(), generateMetadata(), TeacherExamMonitorPage(), TeacherExamMonitorPageProps

### Community 27 - "Community 27"
Cohesion: 0.13
Nodes (14): deleteAllNotifications(), deleteNotification(), getNotifications(), getUnreadNotificationCount(), markAllNotificationsRead(), markNotificationRead(), extractAttemptNumber(), mapDtoToItem() (+6 more)

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (20): AttachmentBlock, AttachmentItem, BlockBase, BlockDefinition, BlockKind, createBlockId(), createBlocksFromSpecification(), createEmptyAttribute() (+12 more)

### Community 29 - "Community 29"
Cohesion: 0.14
Nodes (19): hideExamTemplateLineage(), updateExamTemplateVisibility(), ExamStatusBadge(), ExamQuestionsView(), formatVersionTimestamp(), getStatusMeta(), mapDatabaseInitialization(), mapGradingMethod() (+11 more)

### Community 30 - "Community 30"
Cohesion: 0.20
Nodes (13): AttemptTrend(), buildChart(), formatDelta(), formatScore(), MetricRow(), QuestionFeedbackCard(), scoreTone(), StudentFeedbackView() (+5 more)

### Community 31 - "Community 31"
Cohesion: 0.14
Nodes (16): ErrorSection, getSqlLineCount(), parseErrorSections(), QUESTION_TYPE_LABELS, QuestionCard(), QuestionCardProps, ResultQuestionListProps, getResultStatusLabel() (+8 more)

### Community 32 - "Community 32"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 33 - "Community 33"
Cohesion: 0.14
Nodes (22): login(), loginWithGoogle(), loginWithMicrosoft(), logout(), refreshNewAccessToken(), setAuthCookies(), signUp(), loginRequest (+14 more)

### Community 34 - "Community 34"
Cohesion: 0.07
Nodes (41): clearPreviewSchema(), initializePreviewSchema(), InitializePreviewSchemaResponse, PreviewSubmitAnswerItem, submitExamPreview(), DraftRestoredBanner(), DraftRestoredBannerProps, NetworkStatusBanner() (+33 more)

### Community 35 - "Community 35"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 36 - "Community 36"
Cohesion: 0.11
Nodes (18): 1. App Router & Routing, 1. Git Branch Naming Convention, 2. Auth pages: Login / Register (shared pattern), 2. Commit Message Convention, 3. Pull Request (PR) Rules, 3. `src/lib` – shared logic & domain layer, 4. Data Fetching, Revalidation, Auth & Middleware, 4. Development Workflow (+10 more)

### Community 37 - "Community 37"
Cohesion: 0.06
Nodes (30): For --cluster-only, For git commit hook, For /graphify add, For /graphify explain, For /graphify path, For /graphify query, For native CLAUDE.md integration, For --update (incremental re-extraction) (+22 more)

### Community 38 - "Community 38"
Cohesion: 0.14
Nodes (10): AdminSidebar(), NAV_ITEMS, TeacherHeader(), NAV_ITEMS, TeacherSidebar(), SidebarNavLink(), SidebarNavLinkProps, NAV_ITEMS (+2 more)

### Community 39 - "Community 39"
Cohesion: 0.33
Nodes (4): ButtonSpinner(), sizeMap, Spinner(), SpinnerProps

### Community 40 - "Community 40"
Cohesion: 0.15
Nodes (16): BreadcrumbContext, BreadcrumbCrumbConfig, BreadcrumbCustomRule, BreadcrumbDynamicParams, BreadcrumbParams, BreadcrumbRegexRule, BreadcrumbTemplateRule, extractTemplateParams() (+8 more)

### Community 41 - "Community 41"
Cohesion: 0.14
Nodes (17): collectIssueDetails(), collectIssueKeys(), createDefaultTestCase(), GeneratedRubricIssue, issueMatchesTestCase(), normalizeIssueKey(), normalizeRoutinePayload(), normalizeRoutineTestCase() (+9 more)

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (3): ExamTakeHeader(), ExamTakeHeaderProps, formatTime()

### Community 43 - "Community 43"
Cohesion: 0.12
Nodes (18): sendHeartbeat(), clearExamSchema(), DraftResponse, executeSql(), getForwardedHeaders(), getMyResultFeedback(), PaginationParams, SaveDraftRequest (+10 more)

### Community 44 - "Community 44"
Cohesion: 0.12
Nodes (16): 10. Commit Message Convention, 1. Core Principles, 2. Naming Conventions, 3. TypeScript Guidelines, 4. Component Structure, 5. Styling Standards (Tailwind CSS 4), 6. Form Handling & Validation, 7. State Management (+8 more)

### Community 45 - "Community 45"
Cohesion: 0.11
Nodes (16): SpecificationEditView(), COOKIE_BASE_OPTIONS, ROLES, UserRole, PATH, PRIVATE_PATH, PUBLIC_PATH, metadata (+8 more)

### Community 46 - "Community 46"
Cohesion: 0.15
Nodes (21): BlurOverlay(), VIOLATION_LABELS, VIOLATION_SEVERITY, ViolationType, ExamInterface(), ExamTakeInterface(), ExamWatermark, ExamWatermarkProps (+13 more)

### Community 47 - "Community 47"
Cohesion: 0.20
Nodes (12): ExamBottomPanelProps, ExamInterfaceProps, ExamSidebarProps, ExamTakeBottomPanel(), ExamTakeBottomPanelProps, ResultPanel(), ResultPanelProps, TableSchema (+4 more)

### Community 48 - "Community 48"
Cohesion: 0.20
Nodes (8): ExamResultsViewProps, MUTATION_COLORS, MutationAnalytics(), MutationAnalyticsProps, ExamMutationAnalytics, MutationStat, QuestionMutationSummary, TeacherExamResult

### Community 49 - "Community 49"
Cohesion: 0.06
Nodes (52): createExam(), updateExam(), getSpecificationDetail(), getSpecifications(), createExamWithPdf(), multipartFetch(), updateExamWithPdf(), ClassBansSection() (+44 more)

### Community 50 - "Community 50"
Cohesion: 0.07
Nodes (28): AdminPaginationParams, getAdminFeedbacks(), getAdminUsers(), updateUserRole(), cloneExamTemplate(), getExamTemplates(), getExamTemplateVersions(), shareExamAsTemplate() (+20 more)

### Community 51 - "Community 51"
Cohesion: 0.06
Nodes (50): testGradeCreateTable(), testGradeInsertData(), testGradeRoutineData(), testGradeTriggerData(), CreateTableQueryFromSpec(), sanitizeSchemaTables(), ExamQuestionsViewProps, QUESTION_TYPES (+42 more)

### Community 52 - "Community 52"
Cohesion: 0.15
Nodes (9): ExamStatisticsDashboard(), ExamStatisticsDashboardProps, getScoreColorClass(), MiniDonutProps, QUESTION_TYPE_ICONS, QUESTION_TYPE_LABELS, RadarChartProps, ExamStatistics (+1 more)

### Community 53 - "Community 53"
Cohesion: 0.23
Nodes (11): getClassBans(), getClassDetail(), getClassExams(), getClassTeachers(), getStudentsInClass(), ClassDetailPage(), ClassDetailPageProps, generateMetadata() (+3 more)

### Community 54 - "Community 54"
Cohesion: 0.24
Nodes (14): getTeacherExamDetail(), getExamSpecification(), getExamPreview(), getPreviewExamQuestions(), getExamQuestionsByExamId(), getTeacherExamTemplateVersions(), generateMetadata(), TeacherExamDetailPage() (+6 more)

### Community 55 - "Community 55"
Cohesion: 0.10
Nodes (13): StudentCommonBlock, StudentCommonPartView(), StudentCommonPartViewProps, calcSide(), computeEdges(), EdgeConfig, HandleSide, nodeTypes (+5 more)

### Community 56 - "Community 56"
Cohesion: 0.16
Nodes (17): approveDeviceConflict(), extractErrorMessage(), getExamTime(), getTeacherExamViolations(), rejectDeviceConflict(), reportViolation(), startExamSession(), DeviceConflictDialog() (+9 more)

### Community 57 - "Community 57"
Cohesion: 0.31
Nodes (7): buildFallbackTableScript(), buildForeignKeyScript(), CreateTableQuestionOptions, escapeSqlIdentifier(), generateCreateTableQuestionFromSchema(), GeneratedCreateTableQuestion, topologicalSortTables()

### Community 58 - "Community 58"
Cohesion: 0.22
Nodes (12): getTeacherStudentProgress(), findExamMetaFromTeacherClasses(), parseClassId(), parseExamId(), parseSpecificationId(), parseStudentProgressParams(), ResolvedExamMeta, TeacherBreadcrumbSlot() (+4 more)

### Community 59 - "Community 59"
Cohesion: 0.24
Nodes (12): formatAction(), formatKind(), formatPenalty(), formatQueryCondition(), GradingTraceSection(), GradingTraceSectionProps, hasRuleConfig(), isWeightBased() (+4 more)

### Community 60 - "Community 60"
Cohesion: 0.16
Nodes (11): buildInitial(), calcSide(), computeEdges(), EdgeConfig, HandleSide, KeyIcon(), nodeTypes, SchemaFlow() (+3 more)

### Community 61 - "Community 61"
Cohesion: 0.19
Nodes (8): buildChart(), formatImprovement(), formatScore(), getAttemptLimitText(), ProgressSummary, ScoreTrendChart(), StudentResultProgressView(), SummaryMetric()

### Community 64 - "Community 64"
Cohesion: 0.17
Nodes (13): deleteClass(), getClasses(), restoreClass(), ClassesPageProps, metadata, TeacherClassesPage(), ClassDetailView(), ClassCard() (+5 more)

### Community 65 - "Community 65"
Cohesion: 0.14
Nodes (14): DATA_TYPES, DeniedReviewDialog(), ResultList(), ApiMeta, PaginatedResult, Select(), SelectContent(), SelectItem() (+6 more)

### Community 66 - "Community 66"
Cohesion: 0.15
Nodes (12): AGENTS.md - graduation-project-fe, Auth, Security, and Runtime Context, Backend Contract Context, Commands, Component Rules, Editing Guidance, graphify, Next.js and Data Rules (+4 more)

### Community 67 - "Community 67"
Cohesion: 0.31
Nodes (6): getMyResultDetail(), getMyResults(), StudentResultProgressPage(), formatScore(), resolveProgressExamId(), StudentResultDetailPage()

### Community 68 - "Community 68"
Cohesion: 0.11
Nodes (16): geistMono, geistSans, metadata, msalInstance, ReduxProvider(), ReduxProviderProps, AppDispatch, RootState (+8 more)

### Community 69 - "Community 69"
Cohesion: 0.27
Nodes (9): createDefaultCase(), createDefaultRubric(), ensureMinimumCases(), normalizeSelectRubric(), SelectQueryRubricEditor(), TestCaseTabs(), TestCaseTabsProps, WhiteboxRulesEditor() (+1 more)

### Community 71 - "Community 71"
Cohesion: 0.24
Nodes (6): ExamEditorProps, QuestionListProps, geistMono, SqlEditor(), SqlEditorProps, Question

### Community 72 - "Community 72"
Cohesion: 0.31
Nodes (6): getExamDraft(), saveExamDraft(), formatTime(), SaveStatusIndicator(), SaveStatusIndicatorProps, SaveStatus

### Community 74 - "Community 74"
Cohesion: 0.17
Nodes (10): getExamDetail(), ExamTakePage(), ExamTakePageProps, ExamStartInterface(), localizeError(), FullscreenGateProps, ExamStartPage(), ExamStartPageProps (+2 more)

### Community 75 - "Community 75"
Cohesion: 0.18
Nodes (10): generateGradingRubric(), normalizeTriggerPayload(), toBoolean(), toSyntaxErrorAction(), TriggerRubricEditorProps, MissingPenaltyAction, SyntaxErrorAction, TriggerGradingSettings (+2 more)

### Community 76 - "Community 76"
Cohesion: 0.43
Nodes (5): EntitiesEditorProps, EntitiesEditor(), EntitiesEditorProps, SpecificationEntity, SpecificationEntityAttribute

### Community 78 - "Community 78"
Cohesion: 0.29
Nodes (6): lint-staged, src/**/*.{ts,js,tsx}, name, private, type, version

### Community 81 - "Community 81"
Cohesion: 0.27
Nodes (7): formatScore(), QuestionResultCard(), ResultQuestionList(), SqlViewer(), Badge(), BadgeProps, badgeVariants

### Community 82 - "Community 82"
Cohesion: 0.31
Nodes (11): BLOCK_REGISTRY, ExamBlock, SqlDdlBlock, SqlDmlBlock, ExistingScriptOption, resolveScriptToRun(), ScriptSourceMode, ScriptPickerDialogProps (+3 more)

### Community 83 - "Community 83"
Cohesion: 0.43
Nodes (6): getExamMutationAnalytics(), getExamResults(), getExamStatistics(), ExamResultsView(), ExamResultsPage(), ExamResultsPageProps

### Community 84 - "Community 84"
Cohesion: 0.50
Nodes (3): ExamFormInput, ExamFormValues, examSchema

### Community 97 - "Community 97"
Cohesion: 0.36
Nodes (6): getEnrolledExams(), ExamList(), ExamListProps, ExamStatusBadge(), StudentExamsPage(), StudentExamListItem

### Community 98 - "Community 98"
Cohesion: 0.67
Nodes (3): getExamQuestions(), ExamPage(), tables

## Knowledge Gaps
- **496 isolated node(s):** `config`, `name`, `version`, `private`, `type` (+491 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 8` to `Community 5`, `Community 7`, `Community 9`, `Community 10`, `Community 11`, `Community 13`, `Community 17`, `Community 18`, `Community 24`, `Community 25`, `Community 27`, `Community 29`, `Community 30`, `Community 31`, `Community 34`, `Community 38`, `Community 39`, `Community 42`, `Community 46`, `Community 47`, `Community 49`, `Community 50`, `Community 51`, `Community 55`, `Community 59`, `Community 60`, `Community 61`, `Community 64`, `Community 65`, `Community 67`, `Community 79`, `Community 81`, `Community 97`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `Button` connect `Community 5` to `Community 0`, `Community 1`, `Community 6`, `Community 7`, `Community 8`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 17`, `Community 18`, `Community 19`, `Community 21`, `Community 27`, `Community 28`, `Community 29`, `Community 30`, `Community 31`, `Community 34`, `Community 41`, `Community 42`, `Community 43`, `Community 46`, `Community 49`, `Community 50`, `Community 51`, `Community 56`, `Community 60`, `Community 61`, `Community 64`, `Community 65`, `Community 67`, `Community 69`, `Community 71`, `Community 74`, `Community 75`, `Community 76`, `Community 97`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `PATH` connect `Community 45` to `Community 1`, `Community 5`, `Community 8`, `Community 10`, `Community 18`, `Community 21`, `Community 24`, `Community 26`, `Community 29`, `Community 30`, `Community 33`, `Community 34`, `Community 38`, `Community 43`, `Community 49`, `Community 51`, `Community 53`, `Community 54`, `Community 58`, `Community 61`, `Community 64`, `Community 65`, `Community 67`, `Community 74`, `Community 97`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `config`, `name`, `version` to the rest of the system?**
  _496 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0784313725490196 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._