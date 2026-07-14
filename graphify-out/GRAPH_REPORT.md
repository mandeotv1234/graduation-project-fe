# Graph Report - graduation-project-fe  (2026-07-12)

## Corpus Check
- 348 files · ~191,633 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2068 nodes · 5356 edges · 96 communities (88 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `646c10d2`
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
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 109|Community 109]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 147 edges
2. `Button` - 97 edges
3. `PATH` - 50 edges
4. `useApi()` - 35 edges
5. `ApiClient` - 30 edges
6. `formatDateTime()` - 29 edges
7. `DialogContent()` - 28 edges
8. `DialogHeader()` - 28 edges
9. `DialogTitle()` - 28 edges
10. `Badge()` - 28 edges

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

## Communities (96 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (20): CreateTableTreeRubric(), CreateTableTreeRubricProps, GroupConfig, RuleModifierOption, GradingRulesEditorProps, INSERT_DATA_MODIFIER_OPTIONS, INSERT_DATA_TREE_CONFIG, InsertDataTreeRubric() (+12 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (43): DatabaseBuilderContext, DatabaseBuilderContextType, DatabaseBuilderProvider(), DatabaseBuilderProviderProps, EMPTY_BUILDER_STATE, useBuilderContext(), DatasetEditor(), Header() (+35 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (49): dependencies, @azure/msal-browser, @azure/msal-react, class-variance-authority, clsx, cmdk, date-fns, dompurify (+41 more)

### Community 3 - "Community 3"
Cohesion: 0.20
Nodes (14): GradingResultMessage, UseExamSocketOptions, connectListeners, connectStomp(), getStompClient(), subscribeToConnect(), subscribeToDeviceConflict(), subscribeToExamViolations() (+6 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (50): WhiteboxRulesEditorProps, normalizeTriggerPayload(), toBoolean(), toOptionalNumber(), toSyntaxErrorAction(), TriggerRubricEditor(), Columns, CreateExamQuestionsBatchRequest (+42 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (20): CloneExamTemplateDialogProps, ExamMonitorPanelProps, StudentMonitorState, STEP_ITEMS, formatFileSize(), MoodleSqlImportDialog(), MoodleSqlImportDialogProps, SchemaEditorModalProps (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (22): ACTION_OPTIONS, ALL_TARGET_OPTIONS, buildTargetConditionGuide(), buildTargetModifierGuide(), CREATE_CONDITION_OPTIONS, CREATE_MODIFIER_OPTIONS, CREATE_TARGET_OPTIONS, ensureFriendlyRuleName() (+14 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (46): BuilderPanel(), CatalogRuleButton(), customParam(), customPolicy(), CustomRegexPolicy, CustomRegexTestResult, CustomRegexValidationResult, CustomRuleButton() (+38 more)

### Community 8 - "Community 8"
Cohesion: 0.24
Nodes (10): ExamBottomPanelProps, ExamInterfaceProps, ExamSchemaEditorProps, ExamSidebarProps, ExamTakeBottomPanelProps, TableSchema, Tabs(), TabsContent() (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (15): submitFeedback(), LoginForm(), SpecificationCreateView(), ExamBasicInfoProps, Step2EditRegulations(), useLogin(), GoogleIcon(), MicrosoftIcon() (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.29
Nodes (17): buildBroadRuleSignature(), buildFriendlyRuleName(), buildRuleName(), buildRuleSummary(), buildStrictRuleSignature(), extractColumnHintFromText(), getConditionLabel(), getConditionOptions() (+9 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (11): CombinedConstraint, CONSTRAINT_TYPES, createDefaultRubric(), CreateTableRubricEditor(), normalizeCreateTablePayload(), SQL_TYPES, ConstraintType, CreateTableGradingPayload (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.20
Nodes (9): GradeDetail, GradeResult, isWhiteboxSummaryDetail(), SelectQueryTestGrader(), SelectQueryTestGraderProps, stripWhiteboxPrefix(), WB_STYLE, SelectQueryGradingPayload (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.16
Nodes (9): DeniedReviewDialog(), ResultGroupCard(), ResultList(), ResultGroup, formatScore(), ResultTone, Pagination(), PaginationProps (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.07
Nodes (29): devDependencies, dotenv-cli, eslint, eslint-config-next, eslint-config-prettier, @eslint/eslintrc, @eslint/js, eslint-plugin-prettier (+21 more)

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (20): addTeacherToClass(), banStudent(), confirmMoodleSqlImport(), getStudentDashboard(), getTeacherExamSettings(), postMultipart(), previewMoodleSqlImport(), regradeExamResult() (+12 more)

### Community 17 - "Community 17"
Cohesion: 0.11
Nodes (13): signUp(), getExamDetail(), ROLES, UserRole, PATH, metadata, ExamTakePage(), ExamTakePageProps (+5 more)

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
Cohesion: 0.17
Nodes (9): getMe(), logout(), AdminHeader(), TeacherNotificationBell(), CreateExamHeaderProps, loginRequest, msalConfig, GlobalSearch() (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.07
Nodes (34): deleteExam(), deleteExamQuestion(), forceSubmitStudentExam(), mockQuestions, remindStudent(), updateExamQuestion(), ClassDetailViewProps, UseAntiCheatOptions (+26 more)

### Community 23 - "Community 23"
Cohesion: 0.08
Nodes (23): API Client, Architecture, Auth and Role-Based Routing, Class Utilities, CLAUDE.md — graduation-project-fe, Component Code Order, Component Structure, Constants (+15 more)

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (17): buildChart(), compareHistoryRows(), formatScore(), formatSignedScore(), getImprovementTone(), getStatusConfig(), ProgressSummary, ScoreTrendChart() (+9 more)

### Community 25 - "Community 25"
Cohesion: 0.05
Nodes (60): createExam(), updateExam(), generateEntityDescription(), updateEntityDescription(), createExamWithPdf(), multipartFetch(), updateExamWithPdf(), CreateExamPageClient() (+52 more)

### Community 26 - "Community 26"
Cohesion: 0.10
Nodes (27): getExamQuestions(), buildCreateTablesFromAnswer(), buildInsertTablesFromAnswer(), _catalogCache, createExamQuestionsBatch(), createSpecification(), deleteSpecification(), executeSelectTestCaseConfig() (+19 more)

### Community 27 - "Community 27"
Cohesion: 0.14
Nodes (13): deleteAllNotifications(), deleteNotification(), getNotifications(), getUnreadNotificationCount(), markAllNotificationsRead(), markNotificationRead(), extractAttemptNumber(), mapDtoToItem() (+5 more)

### Community 28 - "Community 28"
Cohesion: 0.14
Nodes (24): AttachmentBlock, AttachmentItem, BLOCK_REGISTRY, BlockBase, BlockDefinition, BlockKind, createBlockId(), createBlocksFromSpecification() (+16 more)

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (13): hideExamTemplateLineage(), updateExamTemplateVisibility(), dropAllExamSchemas(), getStatusMeta(), mapDatabaseInitialization(), mapGradingMethod(), mapScoreDisplayMode(), OverviewItem() (+5 more)

### Community 30 - "Community 30"
Cohesion: 0.16
Nodes (15): getMyResultFeedback(), AttemptTrend(), buildChart(), formatDelta(), formatScore(), MetricRow(), QuestionFeedbackCard(), scoreTone() (+7 more)

### Community 31 - "Community 31"
Cohesion: 0.11
Nodes (16): overrideSubmissionScore(), ErrorSection, getSqlLineCount(), parseErrorSections(), QUESTION_TYPE_LABELS, QuestionCard(), QuestionCardProps, ResultQuestionListProps (+8 more)

### Community 32 - "Community 32"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 33 - "Community 33"
Cohesion: 0.16
Nodes (19): login(), loginWithGoogle(), loginWithMicrosoft(), refreshNewAccessToken(), setAuthCookies(), RequestOptions, COOKIE_BASE_OPTIONS, ENDPOINTS (+11 more)

### Community 34 - "Community 34"
Cohesion: 0.31
Nodes (6): getExamDraft(), formatTime(), SaveStatusIndicator(), SaveStatusIndicatorProps, SaveStatus, useExamDraft()

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
Nodes (10): AdminSidebar(), NAV_ITEMS, TeacherHeader(), NAV_ITEMS, TeacherSidebar(), SidebarNavLink(), SidebarNavLinkProps, StudentHeader() (+2 more)

### Community 39 - "Community 39"
Cohesion: 0.15
Nodes (11): DatasetTableView(), ButtonSpinner(), PageSpinner(), sizeMap, Spinner(), SpinnerProps, StudentCommonBlock, StudentCommonPartView() (+3 more)

### Community 40 - "Community 40"
Cohesion: 0.15
Nodes (16): BreadcrumbContext, BreadcrumbCrumbConfig, BreadcrumbCustomRule, BreadcrumbDynamicParams, BreadcrumbParams, BreadcrumbRegexRule, BreadcrumbTemplateRule, extractTemplateParams() (+8 more)

### Community 41 - "Community 41"
Cohesion: 0.14
Nodes (17): generateGradingRubric(), collectIssueDetails(), collectIssueKeys(), createDefaultTestCase(), GeneratedRubricIssue, issueMatchesTestCase(), normalizeIssueKey(), normalizeRoutinePayload() (+9 more)

### Community 42 - "Community 42"
Cohesion: 0.18
Nodes (15): ClassBansSectionProps, ClassDetailView(), EXAM_STATUS_CONFIG, ExamStatusBadge(), ClassTeachersSectionProps, ClassCard(), ExamCard(), BannedStudentInfo (+7 more)

### Community 43 - "Community 43"
Cohesion: 0.13
Nodes (16): sendHeartbeat(), clearExamSchema(), DraftResponse, getForwardedHeaders(), PaginationParams, SaveDraftRequest, saveExamDraft(), submitExam() (+8 more)

### Community 44 - "Community 44"
Cohesion: 0.12
Nodes (16): 10. Commit Message Convention, 1. Core Principles, 2. Naming Conventions, 3. TypeScript Guidelines, 4. Component Structure, 5. Styling Standards (Tailwind CSS 4), 6. Form Handling & Validation, 7. State Management (+8 more)

### Community 45 - "Community 45"
Cohesion: 0.29
Nodes (9): PRIVATE_PATH, PUBLIC_PATH, buildCsp(), clearAuthCookies(), config, nextWithCsp(), parseExpiryDate(), proxy() (+1 more)

### Community 46 - "Community 46"
Cohesion: 0.12
Nodes (23): BlurOverlay(), VIOLATION_LABELS, VIOLATION_SEVERITY, ViolationType, ExamHeaderProps, ExamInterface(), ExamTakeInterface(), ExamWatermark (+15 more)

### Community 47 - "Community 47"
Cohesion: 0.31
Nodes (8): getTeacherSubmissionDetail(), getResultStatusLabel(), GRADING_TYPE_LABELS, SubmissionDetailView(), SubmissionDetailViewProps, PageProps, SubmissionDetailPage(), TeacherExamResultDetail

### Community 48 - "Community 48"
Cohesion: 0.11
Nodes (20): getExamMutationAnalytics(), getExamResults(), getExamStatistics(), regradeAllExamResults(), ExamResultsView(), ExamResultsViewProps, regradeScopeOptions, ExamStatisticsDashboardProps (+12 more)

### Community 49 - "Community 49"
Cohesion: 0.25
Nodes (7): extractQuestionsFromPdf(), PdfExtractDialogProps, QUESTION_TYPE_LABELS, QUESTION_TYPES, Step, ExtractedQuestionDraft, QuestionType

### Community 50 - "Community 50"
Cohesion: 0.07
Nodes (28): AdminPaginationParams, getAdminFeedbacks(), getAdminUsers(), updateUserRole(), cloneExamTemplate(), getExamTemplates(), getExamTemplateVersions(), shareExamAsTemplate() (+20 more)

### Community 51 - "Community 51"
Cohesion: 0.09
Nodes (29): ExamQuestionsViewProps, QUESTION_TYPES, WHITEBOX_FE_FORCED_TYPES, GeneratedInsertDataQuestion, generateInsertDataQuestionFromDataset(), getDatasetTableNames(), normalizeScript(), parseTableData() (+21 more)

### Community 52 - "Community 52"
Cohesion: 0.07
Nodes (24): clampPercentage(), cssVars(), ExamStatisticsDashboard(), formatNumber(), formatPercent(), getAccuracyClass(), getQuestionTypeMeta(), getScoreClass() (+16 more)

### Community 53 - "Community 53"
Cohesion: 0.12
Nodes (23): getClassBans(), getClassDetail(), getClassExams(), getClassTeachers(), getStudentsInClass(), getTeacherStudentProgress(), findExamMetaFromTeacherClasses(), parseClassId() (+15 more)

### Community 54 - "Community 54"
Cohesion: 0.16
Nodes (19): getTeacherExamDetail(), getTeacherExamMonitor(), getExamSpecification(), getExamPreview(), getPreviewExamQuestions(), getExamQuestionsByExamId(), getTeacherExamTemplateVersions(), ExamMonitorPanel() (+11 more)

### Community 55 - "Community 55"
Cohesion: 0.14
Nodes (12): buildCreateSchemaDiagramData(), buildInitialSchemaDiagram(), calcSide(), computeEdges(), EdgeConfig, HandleSide, nodeTypes, SchemaDiagramData (+4 more)

### Community 56 - "Community 56"
Cohesion: 0.17
Nodes (16): approveDeviceConflict(), extractErrorMessage(), getExamTime(), getTeacherExamViolations(), rejectDeviceConflict(), reportViolation(), startExamSession(), DeviceConflictDialog() (+8 more)

### Community 59 - "Community 59"
Cohesion: 0.24
Nodes (12): formatAction(), formatKind(), formatPenalty(), formatQueryCondition(), GradingTraceSection(), GradingTraceSectionProps, hasRuleConfig(), isWeightBased() (+4 more)

### Community 60 - "Community 60"
Cohesion: 0.10
Nodes (19): createClass(), ClassBansSection(), ClassTeachersSection(), CreateClassPage(), ExamQuestionsView(), formatVersionTimestamp(), SpecificationsView(), useApi() (+11 more)

### Community 61 - "Community 61"
Cohesion: 0.09
Nodes (33): createRulePreset(), deleteRulePreset(), getRulePresets(), updateRulePreset(), ACTION_OPTIONS, RuleNodeConfig, TREE_CONFIG, CustomRegexPolicy (+25 more)

### Community 63 - "Community 63"
Cohesion: 0.18
Nodes (10): getMyResultDetail(), getMyResults(), formatScore(), QuestionResultCard(), ResultQuestionList(), StudentResultProgressPage(), formatScore(), resolveProgressExamId() (+2 more)

### Community 64 - "Community 64"
Cohesion: 0.21
Nodes (10): deleteClass(), getClasses(), restoreClass(), ClassesPageProps, metadata, TeacherClassesPage(), ClassesList(), ClassesListProps (+2 more)

### Community 65 - "Community 65"
Cohesion: 0.22
Nodes (14): updateClass(), AddStudentMode, ConflictErrorType, ConflictRow, EditClassPageProps, DATA_TYPES, CreateClassStudentInfo, ScrollBar() (+6 more)

### Community 66 - "Community 66"
Cohesion: 0.15
Nodes (12): AGENTS.md - graduation-project-fe, Auth, Security, and Runtime Context, Backend Contract Context, Commands, Component Rules, Editing Guidance, graphify, Next.js and Data Rules (+4 more)

### Community 68 - "Community 68"
Cohesion: 0.11
Nodes (16): geistMono, geistSans, metadata, msalInstance, ReduxProvider(), ReduxProviderProps, AppDispatch, RootState (+8 more)

### Community 69 - "Community 69"
Cohesion: 0.24
Nodes (10): createDefaultCase(), createDefaultRubric(), ensureMinimumCases(), normalizeSelectRubric(), SELECT_MUTATION_TYPE_OPTIONS, SelectQueryRubricEditor(), TestCaseTabs(), TestCaseTabsProps (+2 more)

### Community 70 - "Community 70"
Cohesion: 0.48
Nodes (6): getWhiteboxCatalog(), catalogCache, catalogRequests, loadWhiteboxCatalog(), loadWhiteboxCatalogCached(), normalizeQuestionType()

### Community 72 - "Community 72"
Cohesion: 0.19
Nodes (8): buildChart(), formatImprovement(), formatScore(), getAttemptLimitText(), ProgressSummary, ScoreTrendChart(), StudentResultProgressView(), SummaryMetric()

### Community 73 - "Community 73"
Cohesion: 0.15
Nodes (9): detectRelations(), DT_COLOR, ExamSpecificationView(), ExamSpecificationViewProps, Relation, SpecificationPanel(), SpecificationPanelProps, SpecAttribute (+1 more)

### Community 75 - "Community 75"
Cohesion: 0.06
Nodes (37): CustomRegexRuleRowProps, GradeDetail, GradeResult, InsertDataTestGrader(), InsertDataTestGraderProps, GradeDetail, GradeResult, RoutineTestGrader() (+29 more)

### Community 77 - "Community 77"
Cohesion: 0.36
Nodes (6): getEnrolledExams(), ExamList(), ExamListProps, ExamStatusBadge(), StudentExamsPage(), StudentExamListItem

### Community 78 - "Community 78"
Cohesion: 0.29
Nodes (6): lint-staged, src/**/*.{ts,js,tsx}, name, private, type, version

### Community 79 - "Community 79"
Cohesion: 0.07
Nodes (28): globalSearch(), GlobalSearchResult, ExamTakeHeader(), ExamTakeHeaderProps, formatTime(), buildFeatureSearchContext(), extractPathId(), FEATURE_SEARCH_ITEMS (+20 more)

### Community 80 - "Community 80"
Cohesion: 0.31
Nodes (5): ExamStartInterface(), localizeError(), FullscreenGateProps, StartExamSessionResponse, WaitingApprovalOverlay()

### Community 81 - "Community 81"
Cohesion: 0.11
Nodes (22): AiRubricRefinementPanel(), AiRubricRefinementPanelProps, ContextQuery, MODES, CreateTableRubricEditorProps, QuestionFormState, createDefaultRubric(), InsertDataRubricEditor() (+14 more)

### Community 84 - "Community 84"
Cohesion: 0.50
Nodes (3): ExamFormInput, ExamFormValues, examSchema

### Community 85 - "Community 85"
Cohesion: 0.06
Nodes (40): clearPreviewSchema(), initializePreviewSchema(), InitializePreviewSchemaResponse, PreviewSubmitAnswerItem, submitExamPreview(), executeSql(), DraftRestoredBanner(), DraftRestoredBannerProps (+32 more)

### Community 98 - "Community 98"
Cohesion: 0.17
Nodes (12): buildInsertScript(), escapeMsIdentifier(), mapDatasetBlocksToSavePayload(), quoteMsIdentifier(), collectTableNames(), ExecuteSqlInExam, ExportDatasetResult, exportDatasetsFromScript() (+4 more)

### Community 101 - "Community 101"
Cohesion: 0.28
Nodes (10): ExamBlock, ExistingScriptOption, resolveScriptToRun(), ScriptSourceMode, ScriptPickerDialogProps, UseDatasetExportOptions, UseSchemaExportOptions, ResultPanel() (+2 more)

### Community 102 - "Community 102"
Cohesion: 0.39
Nodes (6): exportExamPdfBlob(), fetchExamPdfBlobUrl(), parseContentDispositionFilename(), ResultSpecification(), ResultSpecificationProps, getCookie()

### Community 105 - "Community 105"
Cohesion: 0.43
Nodes (5): EntitiesEditorProps, EntitiesEditor(), EntitiesEditorProps, SpecificationEntity, SpecificationEntityAttribute

### Community 109 - "Community 109"
Cohesion: 0.38
Nodes (4): ExamSampleDataTableProps, ExamFormData, SampleDataRow, SchemaTab

## Knowledge Gaps
- **555 isolated node(s):** `config`, `name`, `version`, `private`, `type` (+550 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 79` to `Community 1`, `Community 5`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 13`, `Community 14`, `Community 18`, `Community 24`, `Community 25`, `Community 29`, `Community 30`, `Community 31`, `Community 38`, `Community 39`, `Community 42`, `Community 46`, `Community 50`, `Community 55`, `Community 59`, `Community 60`, `Community 61`, `Community 63`, `Community 64`, `Community 65`, `Community 72`, `Community 73`, `Community 75`, `Community 77`, `Community 85`, `Community 101`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `Button` connect `Community 75` to `Community 1`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 10`, `Community 12`, `Community 13`, `Community 14`, `Community 17`, `Community 18`, `Community 19`, `Community 21`, `Community 25`, `Community 27`, `Community 28`, `Community 29`, `Community 30`, `Community 31`, `Community 41`, `Community 42`, `Community 46`, `Community 47`, `Community 48`, `Community 49`, `Community 50`, `Community 51`, `Community 56`, `Community 60`, `Community 61`, `Community 63`, `Community 64`, `Community 65`, `Community 69`, `Community 72`, `Community 77`, `Community 79`, `Community 80`, `Community 81`, `Community 85`, `Community 105`, `Community 109`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `ApiClient` connect `Community 50` to `Community 33`, `Community 43`, `Community 79`, `Community 16`, `Community 85`, `Community 22`, `Community 56`, `Community 26`, `Community 27`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `config`, `name`, `version` to the rest of the system?**
  _555 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11067193675889328 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.055178652193577565 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._