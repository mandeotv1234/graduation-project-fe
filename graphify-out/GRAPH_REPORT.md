# Graph Report - graduation-project-fe  (2026-07-17)

## Corpus Check
- 351 files · ~192,861 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2106 nodes · 5473 edges · 105 communities (96 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8a315083`
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
- `SchemaTablesOverview()` --calls--> `cn()`  [EXTRACTED]
  src/app/(main)/student/exams/[examId]/take/components/exam-take-interface/exam-take-interface.tsx → src/lib/utils/cn.ts
- `KeyIcon()` --calls--> `cn()`  [EXTRACTED]
  src/app/(main)/student/exams/[examId]/take/components/schema-flow/schema-flow.tsx → src/lib/utils/cn.ts
- `SpecificationPanel()` --calls--> `cn()`  [EXTRACTED]
  src/app/(main)/student/exams/[examId]/take/components/specification-panel/specification-panel.tsx → src/lib/utils/cn.ts
- `ExamTakeBottomPanelProps` --references--> `ExecuteSqlResponse`  [EXTRACTED]
  src/app/(main)/student/exams/[examId]/take/components/exam-take-bottom-panel/exam-take-bottom-panel.tsx → src/lib/types/exam.type.ts
- `SummaryMetric()` --calls--> `cn()`  [EXTRACTED]
  src/app/(main)/student/(shell)/results/exams/[examId]/student-result-progress-view.tsx → src/lib/utils/cn.ts

## Communities (105 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.18
Nodes (14): GradingResultMessage, UseExamSocketOptions, connectListeners, getStompClient(), subscribeToDeviceConflict(), subscribeToExamViolations(), subscribeToGradingResult(), subscribeToStudentSession() (+6 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (42): createSpecification(), generateSpecificationSchemaByAI(), generateSpecificationSchemaFromDDL(), getSpecificationDetail(), updateSpecification(), SpecificationEditView(), SpecificationEditViewProps, DatabaseBuilderContext (+34 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (49): dependencies, @azure/msal-browser, @azure/msal-react, class-variance-authority, clsx, cmdk, date-fns, dompurify (+41 more)

### Community 3 - "Community 3"
Cohesion: 0.25
Nodes (5): SQL_KEYWORDS, SqlSyntaxHighlight(), SqlSyntaxHighlightProps, Token, TokenKind

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (42): Columns, CreateRulePresetRequest, GradingRuleAction, GradingRuleCondition, GradingSettings, InsertDataColumnConfig, InsertDataExpectedRow, InsertDataGradingSettings (+34 more)

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (23): CloneExamTemplateDialogProps, ACTION_OPTIONS, RuleNodeConfig, TREE_CONFIG, geistMono, TeacherSqlEditorProps, formatFileSize(), MoodleSqlImportDialog() (+15 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (69): CreateTableTreeRubric(), CreateTableTreeRubricProps, GroupConfig, RuleModifierOption, ACTION_OPTIONS, ALL_TARGET_OPTIONS, buildBroadRuleSignature(), buildFriendlyRuleName() (+61 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (48): CustomRegexRuleRowProps, TestGradeResultViewProps, CatalogRuleButton(), customParam(), customPolicy(), CustomRegexPolicy, CustomRegexTestResult, CustomRegexValidationResult (+40 more)

### Community 8 - "Community 8"
Cohesion: 0.17
Nodes (16): updateExam(), buildExamFormInitialData(), EditExamModalButton(), ExamUpdateMergePayload, InitialData, mergeTeacherExamAfterUpdate(), toDateTimeLocalValue(), EditExamSectionModalProps (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (12): LoginForm(), ExamBasicInfoProps, ExamDescriptionEditorProps, ExamFileUploadProps, ExamSampleDataTableProps, useLogin(), GoogleIcon(), MicrosoftIcon() (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (33): globalSearch(), GlobalSearchResult, ClassCard(), OverviewItem(), BuilderPanel(), ValidationMessage(), ExamStatusBadge(), buildFeatureSearchContext() (+25 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (10): CombinedConstraint, CONSTRAINT_TYPES, createDefaultRubric(), CreateTableRubricEditor(), normalizeCreateTablePayload(), SQL_TYPES, ConstraintType, CreateTableGradingPayload (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (16): CreateExamView(), CreateExamViewProps, ExamSettingsForm(), ExamSettingsFormProps, mapSpecificationPreview(), ExamSettingsFormInput, examSettingsFormSchema, ExamSettingsFormValues (+8 more)

### Community 14 - "Community 14"
Cohesion: 0.24
Nodes (5): ResultGroupCard(), ResultGroup, formatScore(), ResultTone, StudentExamResultResponse

### Community 15 - "Community 15"
Cohesion: 0.07
Nodes (29): devDependencies, dotenv-cli, eslint, eslint-config-next, eslint-config-prettier, @eslint/eslintrc, @eslint/js, eslint-plugin-prettier (+21 more)

### Community 16 - "Community 16"
Cohesion: 0.12
Nodes (23): addTeacherToClass(), banStudent(), confirmMoodleSqlImport(), createClass(), createRulePreset(), deleteClass(), deleteRulePreset(), dropAllExamSchemas() (+15 more)

### Community 17 - "Community 17"
Cohesion: 0.13
Nodes (10): ClassesListProps, CreateClassPage(), PATH, metadata, ExamStartInterface(), localizeError(), useRegister(), RegisterForm() (+2 more)

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
Cohesion: 0.13
Nodes (21): generateEntityDescription(), updateEntityDescription(), EditExamModalButtonProps, ExportExamPdfModal(), STEP_ITEMS, EntityDescriptionState, EntityDescriptionStatus, ExportExamPdfModalProps (+13 more)

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
Cohesion: 0.13
Nodes (10): DraftRestoredBanner(), DraftRestoredBannerProps, NetworkStatusBanner(), NetworkStatusBannerProps, ConfirmLeaveDialog(), SchemaMeta, SchemaOverviewColumn, SchemaOverviewTable (+2 more)

### Community 26 - "Community 26"
Cohesion: 0.13
Nodes (17): ClassBansSectionProps, ClassDetailViewProps, EXAM_STATUS_CONFIG, ClassTeachersSectionProps, ExamResultsView(), ExamResultsViewProps, getResultId(), regradeScopeOptions (+9 more)

### Community 27 - "Community 27"
Cohesion: 0.12
Nodes (16): deleteAllNotifications(), deleteNotification(), getNotifications(), getUnreadNotificationCount(), markAllNotificationsRead(), markNotificationRead(), extractAttemptNumber(), mapDtoToItem() (+8 more)

### Community 28 - "Community 28"
Cohesion: 0.06
Nodes (52): AttachmentBlock, AttachmentItem, BLOCK_REGISTRY, BlockBase, BlockDefinition, BlockKind, createBlockId(), createBlocksFromSpecification() (+44 more)

### Community 29 - "Community 29"
Cohesion: 0.22
Nodes (12): deleteExam(), getStatusMeta(), mapDatabaseInitialization(), mapGradingMethod(), mapScoreDisplayMode(), TeacherExamDetailContent(), TeacherExamDetailContentProps, yesNo() (+4 more)

### Community 30 - "Community 30"
Cohesion: 0.16
Nodes (15): getMyResultFeedback(), AttemptTrend(), buildChart(), formatDelta(), formatScore(), MetricRow(), QuestionFeedbackCard(), scoreTone() (+7 more)

### Community 31 - "Community 31"
Cohesion: 0.14
Nodes (20): ClassDetailView(), ExamStatusBadge(), ErrorSection, getSqlLineCount(), parseErrorSections(), QUESTION_TYPE_LABELS, QuestionCard(), QuestionCardProps (+12 more)

### Community 32 - "Community 32"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 33 - "Community 33"
Cohesion: 0.13
Nodes (23): login(), loginWithGoogle(), loginWithMicrosoft(), refreshNewAccessToken(), setAuthCookies(), signUp(), RequestOptions, COOKIE_BASE_OPTIONS (+15 more)

### Community 34 - "Community 34"
Cohesion: 0.27
Nodes (7): getExamDraft(), saveExamDraft(), formatTime(), SaveStatusIndicator(), SaveStatusIndicatorProps, SaveStatus, useExamDraft()

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
Cohesion: 0.12
Nodes (11): AdminHeader(), AdminSidebar(), NAV_ITEMS, TeacherHeader(), NAV_ITEMS, TeacherSidebar(), SidebarNavLink(), SidebarNavLinkProps (+3 more)

### Community 39 - "Community 39"
Cohesion: 0.13
Nodes (12): DatasetTableView(), ResizablePanel(), ResizablePanelProps, ButtonSpinner(), PageSpinner(), sizeMap, Spinner(), SpinnerProps (+4 more)

### Community 40 - "Community 40"
Cohesion: 0.15
Nodes (16): BreadcrumbContext, BreadcrumbCrumbConfig, BreadcrumbCustomRule, BreadcrumbDynamicParams, BreadcrumbParams, BreadcrumbRegexRule, BreadcrumbTemplateRule, extractTemplateParams() (+8 more)

### Community 41 - "Community 41"
Cohesion: 0.14
Nodes (17): collectIssueDetails(), collectIssueKeys(), createDefaultTestCase(), GeneratedRubricIssue, issueMatchesTestCase(), normalizeIssueKey(), normalizeRoutinePayload(), normalizeRoutineTestCase() (+9 more)

### Community 42 - "Community 42"
Cohesion: 0.23
Nodes (11): getClassBans(), getClassDetail(), getClassExams(), getClassTeachers(), getStudentsInClass(), ClassDetailPage(), ClassDetailPageProps, generateMetadata() (+3 more)

### Community 43 - "Community 43"
Cohesion: 0.13
Nodes (18): sendHeartbeat(), clearExamSchema(), DraftResponse, executeSql(), getForwardedHeaders(), PaginationParams, SaveDraftRequest, submitExam() (+10 more)

### Community 44 - "Community 44"
Cohesion: 0.12
Nodes (16): 10. Commit Message Convention, 1. Core Principles, 2. Naming Conventions, 3. TypeScript Guidelines, 4. Component Structure, 5. Styling Standards (Tailwind CSS 4), 6. Form Handling & Validation, 7. State Management (+8 more)

### Community 45 - "Community 45"
Cohesion: 0.14
Nodes (23): CustomRegexPolicy, CustomRegexRuleRow(), stringParam(), WhiteboxAddRuleModal(), normalizeWhiteboxRulePenalty(), requiredParamsSatisfied(), getPolicyMeta(), WhiteboxRuleRow() (+15 more)

### Community 46 - "Community 46"
Cohesion: 0.14
Nodes (23): BlurOverlay(), BlurOverlayProps, resolveMaxViolations(), VIOLATION_LABELS, VIOLATION_SEVERITY, ViolationType, ExamInterface(), ExamTakeInterface() (+15 more)

### Community 47 - "Community 47"
Cohesion: 0.15
Nodes (14): createExam(), extractQuestionsFromPdf(), createExamQuestionsBatch(), createExamWithPdf(), multipartFetch(), updateExamWithPdf(), CreateExamPageClient(), CreateExamPageClientProps (+6 more)

### Community 48 - "Community 48"
Cohesion: 0.18
Nodes (17): clampPercentage(), cssVars(), decodeHtmlEntities(), FailRateBar(), formatPercentFromRatio(), formatScore(), getPassTone(), HTML_ENTITY_MAP (+9 more)

### Community 50 - "Community 50"
Cohesion: 0.06
Nodes (39): AdminPaginationParams, createAdminUser(), getAdminFeedbacks(), getAdminUsers(), updateUserRole(), ROLES, UserRole, PRIVATE_PATH (+31 more)

### Community 51 - "Community 51"
Cohesion: 0.08
Nodes (31): ExamQuestionsViewProps, QUESTION_TYPES, WHITEBOX_FE_FORCED_TYPES, GeneratedInsertDataQuestion, generateInsertDataQuestionFromDataset(), getDatasetTableNames(), normalizeScript(), parseTableData() (+23 more)

### Community 52 - "Community 52"
Cohesion: 0.07
Nodes (26): clampPercentage(), cssVars(), ExamStatisticsDashboard(), ExamStatisticsDashboardProps, formatNumber(), formatPercent(), getAccuracyClass(), getQuestionTypeMeta() (+18 more)

### Community 53 - "Community 53"
Cohesion: 0.15
Nodes (17): getClasses(), getTeacherStudentProgress(), findExamMetaFromTeacherClasses(), parseClassId(), parseExamId(), parseSpecificationId(), parseStudentProgressParams(), ResolvedExamMeta (+9 more)

### Community 54 - "Community 54"
Cohesion: 0.23
Nodes (14): getTeacherExamDetail(), getExamSpecification(), getExamDetail(), getExamQuestionsByExamId(), getTeacherExamTemplateVersions(), ExamTakePage(), ExamTakePageProps, generateMetadata() (+6 more)

### Community 55 - "Community 55"
Cohesion: 0.14
Nodes (12): buildCreateSchemaDiagramData(), buildInitialSchemaDiagram(), calcSide(), computeEdges(), EdgeConfig, HandleSide, nodeTypes, SchemaDiagramData (+4 more)

### Community 56 - "Community 56"
Cohesion: 0.18
Nodes (15): approveDeviceConflict(), extractErrorMessage(), getExamTime(), getTeacherExamViolations(), rejectDeviceConflict(), reportViolation(), startExamSession(), DeviceConflictDialog() (+7 more)

### Community 57 - "Community 57"
Cohesion: 0.18
Nodes (13): getMe(), logout(), submitFeedback(), CreateExamHeaderProps, ExamHeaderProps, ModeToggle(), FeedbackDialog(), FeedbackDialogProps (+5 more)

### Community 58 - "Community 58"
Cohesion: 0.23
Nodes (4): ApiClient, ApiMeta, ApiResponse, PaginatedResult

### Community 59 - "Community 59"
Cohesion: 0.24
Nodes (12): formatAction(), formatKind(), formatPenalty(), formatQueryCondition(), GradingTraceSection(), GradingTraceSectionProps, hasRuleConfig(), isWeightBased() (+4 more)

### Community 60 - "Community 60"
Cohesion: 0.18
Nodes (10): buildInitial(), calcSide(), computeEdges(), EdgeConfig, HandleSide, KeyIcon(), nodeTypes, TableColumn (+2 more)

### Community 61 - "Community 61"
Cohesion: 0.15
Nodes (12): normalizeTriggerPayload(), toBoolean(), toOptionalNumber(), toSyntaxErrorAction(), TriggerRubricEditor(), TriggerRubricEditorProps, MissingPenaltyAction, SyntaxErrorAction (+4 more)

### Community 62 - "Community 62"
Cohesion: 0.16
Nodes (13): cloneExamTemplate(), getExamTemplates(), getExamTemplateVersions(), shareExamAsTemplate(), CloneExamTemplateDialog(), ExamTemplateLibraryTab(), CloneExamTemplateRequest, CloneExamTemplateResponse (+5 more)

### Community 63 - "Community 63"
Cohesion: 0.31
Nodes (6): getMyResultDetail(), getMyResults(), StudentResultProgressPage(), formatScore(), resolveProgressExamId(), StudentResultDetailPage()

### Community 64 - "Community 64"
Cohesion: 0.18
Nodes (10): useActionLock(), PdfExtractDialogProps, QuestionNavigationProps, QUESTION_TYPE_CONFIG, QuestionPanel(), QuestionPanelProps, QUESTION_TYPE_LABELS, QuestionSidebar() (+2 more)

### Community 65 - "Community 65"
Cohesion: 0.14
Nodes (18): AddStudentMode, ConflictErrorType, ConflictRow, EditClassPage(), EditClassPageProps, DATA_TYPES, DatasetTableViewProps, ParsedTableData (+10 more)

### Community 66 - "Community 66"
Cohesion: 0.15
Nodes (12): AGENTS.md - graduation-project-fe, Auth, Security, and Runtime Context, Backend Contract Context, Commands, Component Rules, Editing Guidance, graphify, Next.js and Data Rules (+4 more)

### Community 67 - "Community 67"
Cohesion: 0.16
Nodes (11): ClassBansSection(), ClassTeachersSection(), EditExamSectionModal(), ExamMonitorPanel(), ExamMonitorPanelProps, StudentMonitorState, ExamQuestionsView(), formatVersionTimestamp() (+3 more)

### Community 68 - "Community 68"
Cohesion: 0.33
Nodes (6): exportExamPdfBlob(), fetchExamPdfBlobUrl(), parseContentDispositionFilename(), ResultSpecification(), ResultSpecificationProps, getCookie()

### Community 69 - "Community 69"
Cohesion: 0.17
Nodes (14): executeSelectTestCaseConfig(), generateGradingRubric(), createDefaultCase(), createDefaultRubric(), ensureMinimumCases(), normalizeSelectRubric(), SELECT_MUTATION_TYPE_OPTIONS, SelectQueryRubricEditor() (+6 more)

### Community 71 - "Community 71"
Cohesion: 0.21
Nodes (7): ExamEditorProps, ExamInterfaceProps, QuestionListProps, geistMono, SqlEditor(), SqlEditorProps, Question

### Community 72 - "Community 72"
Cohesion: 0.19
Nodes (8): buildChart(), formatImprovement(), formatScore(), getAttemptLimitText(), ProgressSummary, ScoreTrendChart(), StudentResultProgressView(), SummaryMetric()

### Community 73 - "Community 73"
Cohesion: 0.15
Nodes (9): detectRelations(), DT_COLOR, ExamSpecificationView(), ExamSpecificationViewProps, Relation, SpecificationPanel(), SpecificationPanelProps, SpecAttribute (+1 more)

### Community 74 - "Community 74"
Cohesion: 0.67
Nodes (3): getExamQuestions(), ExamPage(), tables

### Community 75 - "Community 75"
Cohesion: 0.06
Nodes (42): testGradeCreateTable(), testGradeInsertData(), testGradeRoutineData(), testGradeTriggerData(), CreateTableRubricEditorProps, QuestionFormState, GradeDetail, GradeResult (+34 more)

### Community 76 - "Community 76"
Cohesion: 0.25
Nodes (4): formatScore(), QuestionResultCard(), ResultQuestionList(), SqlViewer()

### Community 77 - "Community 77"
Cohesion: 0.43
Nodes (5): getEnrolledExams(), ExamList(), ExamListProps, StudentExamsPage(), StudentExamListItem

### Community 78 - "Community 78"
Cohesion: 0.29
Nodes (6): lint-staged, src/**/*.{ts,js,tsx}, name, private, type, version

### Community 80 - "Community 80"
Cohesion: 0.48
Nodes (6): getWhiteboxCatalog(), catalogCache, catalogRequests, loadWhiteboxCatalog(), loadWhiteboxCatalogCached(), normalizeQuestionType()

### Community 81 - "Community 81"
Cohesion: 0.07
Nodes (32): buildCreateTablesFromAnswer(), buildInsertTablesFromAnswer(), _catalogCache, deleteSpecification(), refineRubricTestCases(), runRubricQaAgent(), saveExamSpecification(), testGradeSelectData() (+24 more)

### Community 82 - "Community 82"
Cohesion: 0.20
Nodes (8): geistMono, geistSans, metadata, msalInstance, AuthProviders(), AuthProvidersProps, TeacherNotificationHandler(), ThemeProvider()

### Community 83 - "Community 83"
Cohesion: 0.23
Nodes (8): ReduxProvider(), ReduxProviderProps, AppDispatch, RootState, store, initialState, sampleSlice, SampleState

### Community 84 - "Community 84"
Cohesion: 0.50
Nodes (3): ExamFormInput, ExamFormValues, examSchema

### Community 85 - "Community 85"
Cohesion: 0.13
Nodes (20): clearPreviewSchema(), getExamPreview(), getPreviewExamQuestions(), initializePreviewSchema(), InitializePreviewSchemaResponse, PreviewSubmitAnswerItem, submitExamPreview(), ConfirmSubmitDialog() (+12 more)

### Community 97 - "Community 97"
Cohesion: 0.60
Nodes (4): getTeacherExamMonitor(), generateMetadata(), TeacherExamMonitorPage(), TeacherExamMonitorPageProps

### Community 98 - "Community 98"
Cohesion: 0.50
Nodes (3): FullscreenGate(), FullscreenGateProps, StartExamSessionResponse

### Community 99 - "Community 99"
Cohesion: 0.40
Nodes (4): hideExamTemplateLineage(), updateExamTemplateVisibility(), TemplateLibraryManagement(), TemplateLibraryManagementProps

### Community 101 - "Community 101"
Cohesion: 0.50
Nodes (3): getTeacherSubmissionDetail(), PageProps, SubmissionDetailPage()

### Community 102 - "Community 102"
Cohesion: 0.53
Nodes (5): getExamMutationAnalytics(), getExamResults(), getExamStatistics(), ExamResultsPage(), ExamResultsPageProps

### Community 103 - "Community 103"
Cohesion: 0.67
Nodes (3): ExamTakeHeader(), ExamTakeHeaderProps, formatTime()

### Community 104 - "Community 104"
Cohesion: 0.67
Nodes (3): getStudentDashboard(), PageProps, StudentDashboardPage()

## Knowledge Gaps
- **564 isolated node(s):** `config`, `name`, `version`, `private`, `type` (+559 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 11` to `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 14`, `Community 17`, `Community 18`, `Community 24`, `Community 25`, `Community 26`, `Community 28`, `Community 29`, `Community 30`, `Community 31`, `Community 38`, `Community 39`, `Community 45`, `Community 46`, `Community 50`, `Community 51`, `Community 55`, `Community 57`, `Community 59`, `Community 60`, `Community 63`, `Community 64`, `Community 65`, `Community 67`, `Community 72`, `Community 73`, `Community 75`, `Community 76`, `Community 77`, `Community 79`, `Community 85`, `Community 103`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `Button` connect `Community 57` to `Community 1`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 10`, `Community 12`, `Community 13`, `Community 14`, `Community 17`, `Community 18`, `Community 19`, `Community 21`, `Community 25`, `Community 26`, `Community 27`, `Community 28`, `Community 29`, `Community 30`, `Community 31`, `Community 41`, `Community 45`, `Community 46`, `Community 47`, `Community 50`, `Community 51`, `Community 56`, `Community 60`, `Community 61`, `Community 62`, `Community 63`, `Community 64`, `Community 65`, `Community 67`, `Community 69`, `Community 71`, `Community 72`, `Community 75`, `Community 77`, `Community 81`, `Community 85`, `Community 98`, `Community 99`, `Community 103`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `SpecificationSchemaJsonTable` connect `Community 51` to `Community 1`, `Community 4`, `Community 81`, `Community 19`, `Community 85`, `Community 22`, `Community 25`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `config`, `name`, `version` to the rest of the system?**
  _564 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06654567453115548 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._