import { useT } from '@open-codesign/i18n';
import { IconButton, Tooltip } from '@open-codesign/ui';
import { ChevronLeft, FolderOpen, Link2, Paperclip, Plus, Sparkles, X } from 'lucide-react';
import { useEffect } from 'react';
import { useAgentStream } from '../hooks/useAgentStream';
import { useCodesignStore } from '../store';
import { ChatMessageList } from './chat/ChatMessageList';
import { CommentChipBar } from './chat/CommentChipBar';
import { CommentsTab } from './chat/CommentsTab';
import { PromptInput } from './chat/PromptInput';
import { SkillChipBar } from './chat/SkillChipBar';

export interface SidebarProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onSubmit: () => void;
}

/**
 * Sidebar v2 — chat-style conversation pane.
 *
 * Replaces the single-shot prompt box with a chat history backed by the
 * chat_messages SQLite table. See docs/plans/2026-04-20-agentic-sidebar-
 * custom-endpoint-design.md §5 for the full spec. Multi-design switcher
 * stays deferred; the design name + "+" header shows the single current
 * design only.
 */
export function Sidebar({ prompt, setPrompt, onSubmit }: SidebarProps) {
  const t = useT();
  const config = useCodesignStore((s) => s.config);
  const isGenerating = useCodesignStore((s) => s.isGenerating);
  const cancelGeneration = useCodesignStore((s) => s.cancelGeneration);
  const inputFiles = useCodesignStore((s) => s.inputFiles);
  const referenceUrl = useCodesignStore((s) => s.referenceUrl);
  const setReferenceUrl = useCodesignStore((s) => s.setReferenceUrl);
  const pickInputFiles = useCodesignStore((s) => s.pickInputFiles);
  const removeInputFile = useCodesignStore((s) => s.removeInputFile);
  const pickDesignSystemDirectory = useCodesignStore((s) => s.pickDesignSystemDirectory);
  const clearDesignSystem = useCodesignStore((s) => s.clearDesignSystem);
  const lastUsage = useCodesignStore((s) => s.lastUsage);

  const chatMessages = useCodesignStore((s) => s.chatMessages);
  const chatLoaded = useCodesignStore((s) => s.chatLoaded);
  const loadChatForCurrentDesign = useCodesignStore((s) => s.loadChatForCurrentDesign);
  const currentDesignId = useCodesignStore((s) => s.currentDesignId);
  const designs = useCodesignStore((s) => s.designs);
  const createNewDesign = useCodesignStore((s) => s.createNewDesign);

  const sidebarTab = useCodesignStore((s) => s.sidebarTab);
  const setSidebarTab = useCodesignStore((s) => s.setSidebarTab);
  const sidebarCollapsed = useCodesignStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useCodesignStore((s) => s.setSidebarCollapsed);
  const attachedSkills = useCodesignStore((s) => s.attachedSkills);
  const toggleAttachedSkill = useCodesignStore((s) => s.toggleAttachedSkill);

  // Mount useAgentStream here so streaming events route into the chat
  // as soon as the Sidebar is in the tree — matches the lifecycle of
  // chat visibility without needing an app-level hook.
  useAgentStream();

  const designSystem = config?.designSystem ?? null;
  const currentDesign = designs.find((d) => d.id === currentDesignId) ?? null;

  useEffect(() => {
    if (currentDesignId && !chatLoaded) {
      void loadChatForCurrentDesign();
    }
  }, [currentDesignId, chatLoaded, loadChatForCurrentDesign]);

  const activeModelLine =
    config?.hasKey && config.modelPrimary ? config.modelPrimary : t('sidebar.chat.noModel');
  const lastTokens = lastUsage ? lastUsage.inputTokens + lastUsage.outputTokens : null;

  if (sidebarCollapsed) {
    return (
      <aside
        className="flex flex-col items-center border-r border-[var(--color-border)] bg-[var(--color-background-secondary)] py-[var(--space-3)] w-[48px]"
        aria-label={t('sidebar.ariaLabel')}
      >
        <IconButton
          size="sm"
          label={t('sidebar.expand')}
          onClick={() => setSidebarCollapsed(false)}
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
        </IconButton>
      </aside>
    );
  }

  return (
    <aside
      className="flex flex-col border-r border-[var(--color-border)] bg-[var(--color-background-secondary)]"
      style={{ minHeight: 0, minWidth: 0 }}
      aria-label={t('sidebar.ariaLabel')}
    >
      {/* Header: current design name + new chat + collapse */}
      <header className="flex items-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)] border-b border-[var(--color-border-muted)]">
        <Sparkles className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" aria-hidden />
        <span className="truncate text-[var(--text-sm)] font-medium text-[var(--color-text-primary)]">
          {currentDesign?.name ?? t('sidebar.noDesign')}
        </span>
        <div className="ml-auto flex items-center gap-[var(--space-1)]">
          <Tooltip label={t('sidebar.newChat')} side="bottom">
            <IconButton
              size="sm"
              label={t('sidebar.newChat')}
              onClick={() => void createNewDesign()}
              disabled={isGenerating}
            >
              <Plus className="w-4 h-4" />
            </IconButton>
          </Tooltip>
          <Tooltip label={t('sidebar.collapse')} side="bottom">
            <IconButton
              size="sm"
              label={t('sidebar.collapse')}
              onClick={() => setSidebarCollapsed(true)}
            >
              <ChevronLeft className="w-4 h-4" />
            </IconButton>
          </Tooltip>
        </div>
      </header>

      {/* Tab strip: Chat | Comments */}
      <div
        role="tablist"
        aria-label={t('sidebar.tabs.ariaLabel')}
        className="flex items-center gap-[var(--space-4)] px-[var(--space-4)] border-b border-[var(--color-border-muted)]"
      >
        {(['chat', 'comments'] as const).map((tab) => {
          const active = sidebarTab === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSidebarTab(tab)}
              className={`py-[var(--space-2)] text-[var(--text-sm)] border-b-2 -mb-[1px] transition-colors duration-[var(--duration-faster)] ${
                active
                  ? 'border-[var(--color-accent)] text-[var(--color-text-primary)] font-medium'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {t(tab === 'chat' ? 'sidebar.tabs.chat' : 'sidebar.tabs.comments')}
            </button>
          );
        })}
      </div>

      {sidebarTab === 'comments' ? (
        <div className="flex-1 overflow-y-auto">
          <CommentsTab />
        </div>
      ) : (
        <>
          {/* Context controls — attachments, reference URL, design system */}
          <div className="px-[var(--space-4)] pt-[var(--space-3)] space-y-[var(--space-2)]">
            <div className="grid grid-cols-2 gap-[var(--space-2)]">
              <button
                type="button"
                onClick={() => void pickInputFiles()}
                className="inline-flex items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-3)] py-[var(--space-2)] text-[var(--text-2xs)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <Paperclip className="w-[var(--size-icon-sm)] h-[var(--size-icon-sm)] text-[var(--color-text-secondary)]" />
                <span className="truncate">{t('sidebar.attachLocalFiles')}</span>
              </button>
              <button
                type="button"
                onClick={() => void pickDesignSystemDirectory()}
                className="inline-flex items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-3)] py-[var(--space-2)] text-[var(--text-2xs)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <FolderOpen className="w-[var(--size-icon-sm)] h-[var(--size-icon-sm)] text-[var(--color-text-secondary)]" />
                <span className="truncate">
                  {designSystem
                    ? t('sidebar.refreshDesignSystemRepo')
                    : t('sidebar.linkDesignSystemRepo')}
                </span>
              </button>
            </div>

            <label className="flex items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-2_5)]">
              <Link2 className="w-[var(--size-icon-sm)] h-[var(--size-icon-sm)] text-[var(--color-text-secondary)] shrink-0" />
              <input
                type="url"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                placeholder={t('sidebar.referenceUrl')}
                className="flex-1 h-[var(--size-input-height)] bg-transparent text-[var(--text-xs)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
              />
            </label>

            {inputFiles.length > 0 ? (
              <div className="flex flex-wrap gap-[var(--space-1_5)]">
                {inputFiles.map((file) => (
                  <span
                    key={file.path}
                    className="inline-flex items-center gap-[var(--space-1)] max-w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-2)] py-[var(--space-0_5)] text-[var(--text-2xs)] text-[var(--color-text-secondary)]"
                  >
                    <span className="truncate max-w-[140px]" title={file.path}>
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeInputFile(file.path)}
                      className="inline-flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                      aria-label={t('sidebar.removeFile', { name: file.name })}
                    >
                      <X className="w-[var(--size-icon-xs)] h-[var(--size-icon-xs)]" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}

            {designSystem ? (
              <div className="flex items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--color-border-muted)] bg-[var(--color-surface)] px-[var(--space-2_5)] py-[var(--space-1_5)] text-[var(--text-2xs)]">
                <span
                  className="truncate text-[var(--color-text-secondary)]"
                  title={designSystem.rootPath}
                >
                  {designSystem.summary}
                </span>
                <button
                  type="button"
                  onClick={() => void clearDesignSystem()}
                  className="ml-auto text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                >
                  {t('sidebar.clear')}
                </button>
              </div>
            ) : null}
          </div>

          {/* Chat scroll area */}
          <div className="flex-1 overflow-y-auto px-[var(--space-4)] py-[var(--space-4)]">
            <ChatMessageList
              messages={chatMessages}
              loading={!chatLoaded}
              empty={
                <p className="text-[var(--text-sm)] text-[var(--color-text-muted)] leading-[var(--leading-body)]">
                  {t('sidebar.startHint')}
                </p>
              }
            />
          </div>

          {/* Skill chips + prompt input + model/tokens line */}
          <div className="border-t border-[var(--color-border-muted)] p-[var(--space-3)] space-y-[var(--space-2)]">
            <CommentChipBar />
            <SkillChipBar
              attached={attachedSkills}
              onToggle={toggleAttachedSkill}
              disabled={isGenerating}
            />
            <PromptInput
              prompt={prompt}
              setPrompt={setPrompt}
              onSubmit={onSubmit}
              onCancel={cancelGeneration}
              isGenerating={isGenerating}
            />
            <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
              <span className="truncate">{activeModelLine}</span>
              {lastTokens !== null ? (
                <span>{t('sidebar.chat.tokensLine', { count: lastTokens })}</span>
              ) : null}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
