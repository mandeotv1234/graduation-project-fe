# Graph Report - graduation-project-fe  (2026-07-17)

## Corpus Check
- 350 files · ~192,655 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2104 nodes · 5466 edges · 105 communities (96 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1058c330`
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
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 104|Community 104]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 149 edges
2. `Button` - 98 edges
3. `PATH` - 50 edges
4. `useApi()` - 35 edges
5. `ApiClient` - 30 edges
6. `DialogContent()` - 29 edges
7. `DialogHeader()` - 29 edges
8. `DialogTitle()` - 29 edges
9. `formatDateTime()` - 29 edges
10. `Dialog()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `ExamStatusBadge()` --calls--> `cn()`  [EXTRACTED]
  src/app/(main)/student/exams/components/exam-list/exam-list.tsx → src/lib/utils/cn.ts
- `SchemaTablesOverview()` --calls--> `cn()`  [EXTRACTED]
  src/app/(main)/student/exams/[examId]/take/components/exam-take-interface/exam-take-interface.tsx → src/lib/utils/cn.ts
- `KeyIcon()` --calls--> `cn()`  [EXTRACTED]
  src/app/(main)/student/exams/[examId]/take/components/schema-flow/schema-flow.tsx → src/lib/utils/cn.ts
- `SpecificationPanel()` --calls--> `cn()`  [EXTRACTED]
  src/app/(main)/student/exams/[examId]/take/components/specification-panel/specification-panel.tsx → src/lib/utils/cn.ts
- `ExamTakeBottomPanelProps` --references--> `ExecuteSqlResponse`  [EXTRACTED]
  src/app/(main)/student/exams/[examId]/take/components/exam-take-bottom-panel/exam-take-bottom-panel.tsx → src/lib/types/exam.type.ts

## Communities (105 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.16
Nodes (17): DeviceConflictDialog(), GradingResultMessage, UseExamSocketOptions, TeacherNotificationHandler(), connectListeners, connectStomp(), getStompClient(), subscribeToConnect() (+9 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (34): DatabaseBuilderContext, DatabaseBuilderContextType, DatabaseBuilderProvider(), DatabaseBuilderProviderProps, EMPTY_BUILDER_STATE, useBuilderContext(), DatasetEditor(), Header() (+26 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (49): dependencies, @azure/msal-browser, @azure/msal-react, class-variance-authority, clsx, cmdk, date-fns, dompurify (+41 more)

### Community 3 - "Community 3"
Cohesion: 0.25
Nodes (5): SQL_KEYWORDS, SqlSyntaxHighlight(), SqlSyntaxHighlightProps, Token, TokenKind

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (53): normalizeTriggerPayload(), toBoolean(), toOptionalNumber(), toSyntaxErrorAction(), TriggerRubricEditor(), Columns, CreateRulePresetRequest, GradingRuleAction (+45 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (28): extractQuestionsFromPdf(), createExamQuestionsBatch(), CloneExamTemplateDialogProps, geistMono, TeacherSqlEditorProps, STEP_ITEMS, Step2EditRegulations(), MoodleSqlImportDialogProps (+20 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (24): ACTION_OPTIONS, ALL_TARGET_OPTIONS, buildTargetConditionGuide(), buildTargetModifierGuide(), CREATE_CONDITION_OPTIONS, CREATE_MODIFIER_OPTIONS, CREATE_TARGET_OPTIONS, ensureFriendlyRuleName() (+16 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (42): BuilderPanel(), CatalogRuleButton(), customParam(), customPolicy(), CustomRegexPolicy, CustomRegexTestResult, CustomRegexValidationResult, CustomRuleButton() (+34 more)

### Community 8 - "Community 8"
Cohesion: 0.24
Nodes (10): ExamBottomPanelProps, ExamInterfaceProps, ExamSchemaEditorProps, ExamSidebarProps, ExamTakeBottomPanelProps, TableSchema, Tabs(), TabsContent() (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.35
Nodes (5): LoginForm(), useLogin(), GoogleIcon(), MicrosoftIcon(), LoginForm()

### Community 11 - "Community 11"
Cohesion: 0.16
Nodes (12): globalSearch(), GlobalSearchResult, ENDPOINTS, buildFeatureSearchContext(), extractPathId(), FEATURE_SEARCH_ITEMS, FeatureSearchContext, FeatureSearchItem (+4 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (12): buildCreateSchemaDiagramData(), CombinedConstraint, CONSTRAINT_TYPES, createDefaultRubric(), CreateTableRubricEditor(), normalizeCreateTablePayload(), SQL_TYPES, buildInitialSchemaDiagram() (+4 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (13): testGradeSelectData(), GradeDetail, GradeResult, isWhiteboxSummaryDetail(), SelectQueryTestGrader(), SelectQueryTestGraderProps, stripWhiteboxPrefix(), WB_STYLE (+5 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (9): DeniedReviewDialog(), ResultGroupCard(), ResultList(), ResultGroup, formatScore(), ResultTone, ApiMeta, PaginatedResult (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.07
Nodes (29): devDependencies, dotenv-cli, eslint, eslint-config-next, eslint-config-prettier, @eslint/eslintrc, @eslint/js, eslint-plugin-prettier (+21 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (21): addTeacherToClass(), banStudent(), confirmMoodleSqlImport(), createClass(), createRulePreset(), deleteRulePreset(), dropAllExamSchemas(), getRulePresets() (+13 more)

### Community 17 - "Community 17"
Cohesion: 0.25
Nodes (7): getExamDetail(), ExamTakePage(), ExamTakePageProps, ExamStartInterface(), localizeError(), ExamStartPage(), ExamStartPageProps

### Community 18 - "Community 18"
Cohesion: 0.30
Nodes (14): ConfirmLeaveDialogProps, ConfirmSubmitDialogProps, RoutineSuggestion, SqlEditorPanelProps, RunTarget, SqlPlaygroundProps, AlertDialogAction, AlertDialogCancel (+6 more)

### Community 19 - "Community 19"
Cohesion: 0.07
Nodes (33): buildCreateTableSqlFromDdl(), CreateTableQueryFromSpec(), CreateTableQueryFromSpecProps, CreateTableSpecSource, Entity, EntityAttribute, normalizeTableName(), SchemaColumn (+25 more)

### Community 20 - "Community 20"
Cohesion: 0.07
Nodes (27): scripts, build, dev, format, lint, lint-staged, postinstall, prepare (+19 more)

### Community 21 - "Community 21"
Cohesion: 0.05
Nodes (59): createExam(), updateExam(), generateEntityDescription(), updateEntityDescription(), createExamWithPdf(), multipartFetch(), updateExamWithPdf(), CreateExamPageClient() (+51 more)

### Community 22 - "Community 22"
Cohesion: 0.08
Nodes (29): deleteExamQuestion(), forceSubmitStudentExam(), mockQuestions, remindStudent(), updateExamQuestion(), UseAntiCheatOptions, ExamSettings, ExtractQuestionsFromPdfResult (+21 more)

### Community 23 - "Community 23"
Cohesion: 0.08
Nodes (23): API Client, Architecture, Auth and Role-Based Routing, Class Utilities, CLAUDE.md — graduation-project-fe, Component Code Order, Component Structure, Constants (+15 more)

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (17): buildChart(), compareHistoryRows(), formatScore(), formatSignedScore(), getImprovementTone(), getStatusConfig(), ProgressSummary, ScoreTrendChart() (+9 more)

### Community 25 - "Community 25"
Cohesion: 0.11
Nodes (20): CreateTableTreeRubric(), CreateTableTreeRubricProps, GroupConfig, RuleModifierOption, GradingRulesEditorProps, INSERT_DATA_MODIFIER_OPTIONS, INSERT_DATA_TREE_CONFIG, InsertDataTreeRubric() (+12 more)

### Community 26 - "Community 26"
Cohesion: 0.31
Nodes (9): ClassBansSectionProps, ClassDetailViewProps, EXAM_STATUS_CONFIG, ClassTeachersSectionProps, BannedStudentInfo, ClassDetail, ClassExamItem, ClassTeacher (+1 more)

### Community 27 - "Community 27"
Cohesion: 0.14
Nodes (13): deleteAllNotifications(), deleteNotification(), getNotifications(), getUnreadNotificationCount(), markAllNotificationsRead(), markNotificationRead(), extractAttemptNumber(), mapDtoToItem() (+5 more)

### Community 28 - "Community 28"
Cohesion: 0.11
Nodes (32): AttachmentBlock, AttachmentItem, BLOCK_REGISTRY, BlockBase, BlockDefinition, BlockKind, createBlockId(), createBlocksFromSpecification() (+24 more)

### Community 29 - "Community 29"
Cohesion: 0.20
Nodes (13): deleteExam(), getStatusMeta(), mapDatabaseInitialization(), mapGradingMethod(), mapScoreDisplayMode(), OverviewItem(), TeacherExamDetailContent(), TeacherExamDetailContentProps (+5 more)

### Community 30 - "Community 30"
Cohesion: 0.16
Nodes (15): getMyResultFeedback(), AttemptTrend(), buildChart(), formatDelta(), formatScore(), MetricRow(), QuestionFeedbackCard(), scoreTone() (+7 more)

### Community 31 - "Community 31"
Cohesion: 0.16
Nodes (17): ClassDetailView(), ExamStatusBadge(), ErrorSection, getSqlLineCount(), parseErrorSections(), QUESTION_TYPE_LABELS, QuestionCard(), getResultStatusLabel() (+9 more)

### Community 32 - "Community 32"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 33 - "Community 33"
Cohesion: 0.13
Nodes (24): login(), loginWithGoogle(), loginWithMicrosoft(), logout(), refreshNewAccessToken(), setAuthCookies(), signUp(), RequestOptions (+16 more)

### Community 34 - "Community 34"
Cohesion: 0.60
Nodes (4): formatTime(), SaveStatusIndicator(), SaveStatusIndicatorProps, SaveStatus

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
Cohesion: 0.10
Nodes (14): AdminHeader(), AdminSidebar(), NAV_ITEMS, CreateClassPage(), TeacherHeader(), NAV_ITEMS, TeacherSidebar(), PATH (+6 more)

### Community 39 - "Community 39"
Cohesion: 0.16
Nodes (10): DatasetTableView(), ButtonSpinner(), PageSpinner(), sizeMap, Spinner(), SpinnerProps, StudentCommonBlock, StudentCommonPartView() (+2 more)

### Community 40 - "Community 40"
Cohesion: 0.15
Nodes (16): BreadcrumbContext, BreadcrumbCrumbConfig, BreadcrumbCustomRule, BreadcrumbDynamicParams, BreadcrumbParams, BreadcrumbRegexRule, BreadcrumbTemplateRule, extractTemplateParams() (+8 more)

### Community 41 - "Community 41"
Cohesion: 0.15
Nodes (16): collectIssueDetails(), collectIssueKeys(), createDefaultTestCase(), GeneratedRubricIssue, issueMatchesTestCase(), normalizeIssueKey(), normalizeRoutinePayload(), normalizeRoutineTestCase() (+8 more)

### Community 42 - "Community 42"
Cohesion: 0.23
Nodes (11): getClassBans(), getClassDetail(), getClassExams(), getClassTeachers(), getStudentsInClass(), ClassDetailPage(), ClassDetailPageProps, generateMetadata() (+3 more)

### Community 43 - "Community 43"
Cohesion: 0.11
Nodes (19): sendHeartbeat(), clearExamSchema(), DraftResponse, executeSql(), getExamDraft(), getForwardedHeaders(), PaginationParams, SaveDraftRequest (+11 more)

### Community 44 - "Community 44"
Cohesion: 0.12
Nodes (16): 10. Commit Message Convention, 1. Core Principles, 2. Naming Conventions, 3. TypeScript Guidelines, 4. Component Structure, 5. Styling Standards (Tailwind CSS 4), 6. Form Handling & Validation, 7. State Management (+8 more)

### Community 45 - "Community 45"
Cohesion: 0.15
Nodes (18): validateWhitebox(), WhiteboxAddRuleModal(), defaultRuleFromCatalog(), detectConflicts(), isCustomRegexRule(), normalizeWhiteboxRulePenalty(), POLICY_BADGE_CLASS, requiredParamsSatisfied() (+10 more)

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (15): BlurOverlay(), resolveMaxViolations(), ExamInterface(), ExamTakeInterface(), ExamWatermark, ExamWatermarkProps, FullscreenGate(), useAntiCheat() (+7 more)

### Community 47 - "Community 47"
Cohesion: 0.17
Nodes (7): EntitiesEditorProps, StudentCommonBlock, StudentCommonPartViewProps, EntitiesEditor(), EntitiesEditorProps, SpecificationEntity, SpecificationEntityAttribute

### Community 48 - "Community 48"
Cohesion: 0.20
Nodes (15): clampPercentage(), cssVars(), decodeHtmlEntities(), FailRateBar(), formatPercentFromRatio(), formatScore(), getPassTone(), HTML_ENTITY_MAP (+7 more)

### Community 50 - "Community 50"
Cohesion: 0.06
Nodes (36): AdminPaginationParams, createAdminUser(), getAdminFeedbacks(), getAdminUsers(), updateUserRole(), ROLES, UserRole, PRIVATE_PATH (+28 more)

### Community 51 - "Community 51"
Cohesion: 0.07
Nodes (34): getWhiteboxCatalog(), ExamQuestionsView(), ExamQuestionsViewProps, formatVersionTimestamp(), QUESTION_TYPES, WHITEBOX_FE_FORCED_TYPES, GeneratedInsertDataQuestion, generateInsertDataQuestionFromDataset() (+26 more)

### Community 52 - "Community 52"
Cohesion: 0.07
Nodes (24): clampPercentage(), cssVars(), ExamStatisticsDashboard(), formatNumber(), formatPercent(), getAccuracyClass(), getQuestionTypeMeta(), getScoreClass() (+16 more)

### Community 53 - "Community 53"
Cohesion: 0.15
Nodes (15): getSpecificationDetail(), getTeacherStudentProgress(), findExamMetaFromTeacherClasses(), parseClassId(), parseExamId(), parseSpecificationId(), parseStudentProgressParams(), ResolvedExamMeta (+7 more)

### Community 54 - "Community 54"
Cohesion: 0.24
Nodes (14): getTeacherExamDetail(), getTeacherExamMonitor(), getExamSpecification(), getExamQuestionsByExamId(), getTeacherExamTemplateVersions(), generateMetadata(), TeacherExamDetailPage(), TeacherExamDetailPageProps (+6 more)

### Community 55 - "Community 55"
Cohesion: 0.12
Nodes (13): ResultPanel(), ResultPanelProps, calcSide(), computeEdges(), EdgeConfig, HandleSide, nodeTypes, SchemaDiagramData (+5 more)

### Community 56 - "Community 56"
Cohesion: 0.28
Nodes (10): approveDeviceConflict(), extractErrorMessage(), getExamTime(), getTeacherExamViolations(), rejectDeviceConflict(), reportViolation(), startExamSession(), DeviceConflictDialogProps (+2 more)

### Community 57 - "Community 57"
Cohesion: 0.15
Nodes (12): getMe(), NetworkStatusBannerProps, CreateExamHeaderProps, ExamDescriptionEditorProps, ExamFileUploadProps, ExamHeaderProps, ModeToggle(), User (+4 more)

### Community 59 - "Community 59"
Cohesion: 0.24
Nodes (12): formatAction(), formatKind(), formatPenalty(), formatQueryCondition(), GradingTraceSection(), GradingTraceSectionProps, hasRuleConfig(), isWeightBased() (+4 more)

### Community 60 - "Community 60"
Cohesion: 0.10
Nodes (19): ClassBansSection(), ClassTeachersSection(), EditExamSectionModal(), ExamMonitorPanel(), ExamMonitorPanelProps, StudentMonitorState, SpecificationsView(), useApi() (+11 more)

### Community 61 - "Community 61"
Cohesion: 0.12
Nodes (20): ACTION_OPTIONS, RuleNodeConfig, TREE_CONFIG, CustomRegexPolicy, CustomRegexRuleRow(), stringParam(), CreateUserFormValues, createUserSchema (+12 more)

### Community 62 - "Community 62"
Cohesion: 0.16
Nodes (13): cloneExamTemplate(), getExamTemplates(), getExamTemplateVersions(), shareExamAsTemplate(), CloneExamTemplateDialog(), ExamTemplateLibraryTab(), CloneExamTemplateRequest, CloneExamTemplateResponse (+5 more)

### Community 63 - "Community 63"
Cohesion: 0.15
Nodes (13): getMyResultDetail(), getMyResults(), QuestionCardProps, formatScore(), QuestionResultCard(), ResultQuestionList(), ResultQuestionListProps, StudentResultProgressPage() (+5 more)

### Community 64 - "Community 64"
Cohesion: 0.19
Nodes (11): deleteClass(), getClasses(), restoreClass(), ClassesPageProps, metadata, TeacherClassesPage(), ClassCard(), ClassesList() (+3 more)

### Community 65 - "Community 65"
Cohesion: 0.14
Nodes (18): AddStudentMode, ConflictErrorType, ConflictRow, EditClassPage(), EditClassPageProps, DATA_TYPES, DatasetTableViewProps, ParsedTableData (+10 more)

### Community 66 - "Community 66"
Cohesion: 0.15
Nodes (12): AGENTS.md - graduation-project-fe, Auth, Security, and Runtime Context, Backend Contract Context, Commands, Component Rules, Editing Guidance, graphify, Next.js and Data Rules (+4 more)

### Community 67 - "Community 67"
Cohesion: 0.29
Nodes (17): buildBroadRuleSignature(), buildFriendlyRuleName(), buildRuleName(), buildRuleSummary(), buildStrictRuleSignature(), extractColumnHintFromText(), getConditionLabel(), getConditionOptions() (+9 more)

### Community 68 - "Community 68"
Cohesion: 0.20
Nodes (7): ExamResultsView(), getResultId(), regradeScopeOptions, formatFileSize(), MoodleSqlImportDialog(), Pagination(), PaginationProps

### Community 69 - "Community 69"
Cohesion: 0.20
Nodes (12): executeSelectTestCaseConfig(), generateGradingRubric(), createDefaultCase(), createDefaultRubric(), ensureMinimumCases(), normalizeSelectRubric(), SELECT_MUTATION_TYPE_OPTIONS, SelectQueryRubricEditor() (+4 more)

### Community 70 - "Community 70"
Cohesion: 0.22
Nodes (5): SpecificationCreateView(), ExamBasicInfoProps, metadata, Input(), Label()

### Community 71 - "Community 71"
Cohesion: 0.24
Nodes (6): ExamEditorProps, QuestionListProps, geistMono, SqlEditor(), SqlEditorProps, Question

### Community 72 - "Community 72"
Cohesion: 0.19
Nodes (8): buildChart(), formatImprovement(), formatScore(), getAttemptLimitText(), ProgressSummary, ScoreTrendChart(), StudentResultProgressView(), SummaryMetric()

### Community 73 - "Community 73"
Cohesion: 0.12
Nodes (16): exportExamPdfBlob(), fetchExamPdfBlobUrl(), parseContentDispositionFilename(), ResultSpecification(), ResultSpecificationProps, CreateExamFormProps, detectRelations(), DT_COLOR (+8 more)

### Community 74 - "Community 74"
Cohesion: 0.67
Nodes (3): getExamQuestions(), ExamPage(), tables

### Community 75 - "Community 75"
Cohesion: 0.06
Nodes (38): testGradeCreateTable(), testGradeInsertData(), testGradeRoutineData(), testGradeTriggerData(), AiRubricRefinementPanelProps, CreateTableRubricEditorProps, CustomRegexRuleRowProps, QuestionFormState (+30 more)

### Community 76 - "Community 76"
Cohesion: 0.38
Nodes (5): submitFeedback(), FeedbackDialog(), FeedbackDialogProps, SubmitResultDialogProps, SubmitExamResponse

### Community 77 - "Community 77"
Cohesion: 0.36
Nodes (6): getEnrolledExams(), ExamList(), ExamListProps, ExamStatusBadge(), StudentExamsPage(), StudentExamListItem

### Community 78 - "Community 78"
Cohesion: 0.29
Nodes (6): lint-staged, src/**/*.{ts,js,tsx}, name, private, type, version

### Community 79 - "Community 79"
Cohesion: 0.11
Nodes (17): ExamTakeHeader(), ExamTakeHeaderProps, formatTime(), Command(), CommandDialog(), CommandGroup(), CommandInput(), CommandItem() (+9 more)

### Community 80 - "Community 80"
Cohesion: 0.18
Nodes (12): VIOLATION_LABELS, VIOLATION_SEVERITY, ViolationType, antiCheatSlice, AntiCheatState, initialState, ExamTimeResponse, ReportViolationRequest (+4 more)

### Community 81 - "Community 81"
Cohesion: 0.07
Nodes (33): buildCreateTablesFromAnswer(), buildInsertTablesFromAnswer(), _catalogCache, createSpecification(), deleteSpecification(), generateSpecificationSchemaByAI(), generateSpecificationSchemaFromDDL(), refineRubricTestCases() (+25 more)

### Community 82 - "Community 82"
Cohesion: 0.22
Nodes (7): geistMono, geistSans, metadata, msalInstance, AuthProviders(), AuthProvidersProps, ThemeProvider()

### Community 83 - "Community 83"
Cohesion: 0.16
Nodes (11): FullscreenGateProps, ReduxProvider(), ReduxProviderProps, AppDispatch, RootState, store, initialState, sampleSlice (+3 more)

### Community 84 - "Community 84"
Cohesion: 0.50
Nodes (3): ExamFormInput, ExamFormValues, examSchema

### Community 85 - "Community 85"
Cohesion: 0.06
Nodes (41): clearPreviewSchema(), getExamPreview(), getPreviewExamQuestions(), initializePreviewSchema(), InitializePreviewSchemaResponse, PreviewSubmitAnswerItem, submitExamPreview(), DraftRestoredBanner() (+33 more)

### Community 97 - "Community 97"
Cohesion: 0.38
Nodes (4): ExamSampleDataTableProps, ExamFormData, SampleDataRow, SchemaTab

### Community 98 - "Community 98"
Cohesion: 0.25
Nodes (10): buildInsertScript(), escapeMsIdentifier(), quoteMsIdentifier(), collectTableNames(), ExecuteSqlInExam, ExportDatasetResult, exportDatasetsFromScript(), ExportedDataset (+2 more)

### Community 99 - "Community 99"
Cohesion: 0.40
Nodes (4): hideExamTemplateLineage(), updateExamTemplateVisibility(), TemplateLibraryManagement(), TemplateLibraryManagementProps

### Community 101 - "Community 101"
Cohesion: 0.50
Nodes (3): getTeacherSubmissionDetail(), PageProps, SubmissionDetailPage()

### Community 102 - "Community 102"
Cohesion: 0.23
Nodes (11): getExamMutationAnalytics(), getExamResults(), getExamStatistics(), ExamResultsViewProps, ExamStatisticsDashboardProps, MutationAnalyticsProps, ExamResultsPage(), ExamResultsPageProps (+3 more)

### Community 104 - "Community 104"
Cohesion: 0.67
Nodes (3): getStudentDashboard(), PageProps, StudentDashboardPage()

## Knowledge Gaps
- **563 isolated node(s):** `config`, `name`, `version`, `private`, `type` (+558 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 79` to `Community 5`, `Community 7`, `Community 8`, `Community 9`, `Community 13`, `Community 14`, `Community 18`, `Community 21`, `Community 24`, `Community 29`, `Community 30`, `Community 31`, `Community 38`, `Community 39`, `Community 45`, `Community 46`, `Community 50`, `Community 55`, `Community 57`, `Community 59`, `Community 60`, `Community 61`, `Community 63`, `Community 64`, `Community 65`, `Community 68`, `Community 70`, `Community 72`, `Community 73`, `Community 76`, `Community 77`, `Community 85`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `Button` connect `Community 57` to `Community 1`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 10`, `Community 12`, `Community 13`, `Community 14`, `Community 17`, `Community 18`, `Community 19`, `Community 21`, `Community 26`, `Community 27`, `Community 28`, `Community 29`, `Community 30`, `Community 31`, `Community 38`, `Community 41`, `Community 45`, `Community 46`, `Community 47`, `Community 51`, `Community 56`, `Community 60`, `Community 61`, `Community 62`, `Community 63`, `Community 64`, `Community 65`, `Community 68`, `Community 69`, `Community 71`, `Community 72`, `Community 75`, `Community 76`, `Community 77`, `Community 79`, `Community 81`, `Community 83`, `Community 85`, `Community 97`, `Community 99`, `Community 103`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `SpecificationSchemaJsonTable` connect `Community 81` to `Community 1`, `Community 4`, `Community 73`, `Community 19`, `Community 51`, `Community 85`, `Community 22`, `Community 21`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `config`, `name`, `version` to the rest of the system?**
  _563 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08880666049953746 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.03932244404113733 - nodes in this community are weakly interconnected._