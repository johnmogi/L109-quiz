/**
 * LearnDash Quiz - Hint Enforcement System (REPAIRED VERSION)
 * 
 * Simple, reliable hint enforcement based on proven working approach
 * Fixes: Browser caching, dual blocking systems, complex code conflicts
 * Version: REPAIRED - Clean implementation
 */
(function($) {
    'use strict';
    
    // Configuration - simplified and reliable
    const config = {
        debug: true,
        tooltipText: 'טעית! להמשך חובה לקחת רמז!'
    };
    
    // State management - simplified
    const state = {
        hintViewed: false,
        isBlocked: false
    };
    
    // Debug logger
    const log = {
        info: function(message, data) {
            if (config.debug) {
                const prefix = '%c[HINT-REPAIRED] ';
                const style = 'color: #28a745; font-weight: bold;';
                if (data) {
                    console.log(prefix + message, style, data);
                } else {
                    console.log(prefix + message, style);
                }
            }
        },
        error: function(message, data) {
            const prefix = '%c[HINT-ERROR] ';
            const style = 'color: #dc3545; font-weight: bold;';
            if (data) {
                console.error(prefix + message, style, data);
            } else {
                console.error(prefix + message, style);
            }
        }
    };
    
    log.info('✅ REPAIRED Quiz hint enforcement loaded successfully - CLEAN VERSION');
    console.log('%c✅ HINT ENFORCEMENT REPAIRED - CLEAN SYSTEM ACTIVE', 'color: green; font-size: 16px; font-weight: bold;');
    
    /**
     * CLEAN: Simple and reliable blocking system based on proven approach
     */
    const QuizBlocker = {
        isBlocked: false,
        globalBlockers: [],
        
        init() {
            log.info('🛡️ Clean blocking system initialized');
            this.watchForWrongAnswers();
            this.setupHintHandlers();
        },
        
        watchForWrongAnswers() {
            log.info('👀 Watching for wrong answer detection');
            
            // Watch for error messages that indicate wrong answers
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const elementsToCheck = [node, ...node.querySelectorAll('*')];
                                elementsToCheck.forEach(element => {
                                    const elementText = element.textContent || '';
                                    if (elementText.includes('תשובה לא נכונה') || 
                                        elementText.includes('שגוי') ||
                                        elementText.includes('incorrect')) {
                                        const computedStyle = window.getComputedStyle(element);
                                        if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
                                            log.info('❌ Wrong answer detected, blocking inputs');
                                            this.blockQuizInputs();
                                            this.showHintMessage();
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },
        
        blockQuizInputs() {
            if (this.isBlocked) return;
            
            log.info('🚫 Blocking quiz inputs - simple approach');
            
            // Find quiz inputs
            const inputs = document.querySelectorAll('.wpProQuiz_questionListItem input[type="radio"], .wpProQuiz_questionListItem input[type="checkbox"]');
            const labels = document.querySelectorAll('.wpProQuiz_questionListItem label');
            const questionItems = document.querySelectorAll('.wpProQuiz_questionListItem');
            
            log.info(`Found ${inputs.length} inputs, ${labels.length} labels, ${questionItems.length} items to block`);
            
            // Block inputs - simple and reversible
            inputs.forEach((input, index) => {
                input.disabled = true;
                input.style.pointerEvents = 'none';
                input.style.opacity = '0.5';
                input.style.cursor = 'not-allowed';
                input.setAttribute('data-quiz-blocked', 'true');
                log.info(`🚫 Blocked input ${index + 1}`);
            });
            
            // Block labels
            labels.forEach((label, index) => {
                label.style.pointerEvents = 'none';
                label.style.cursor = 'not-allowed';
                label.style.opacity = '0.6';
                label.setAttribute('data-quiz-blocked', 'true');
            });
            
            // Block question items with visual overlay
            questionItems.forEach((item, index) => {
                item.style.position = 'relative';
                item.setAttribute('data-quiz-blocked', 'true');
                
                // Add simple visual overlay
                if (!item.querySelector('.quiz-block-overlay')) {
                    const overlay = document.createElement('div');
                    overlay.className = 'quiz-block-overlay';
                    overlay.style.cssText = `
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                        background: rgba(220, 53, 69, 0.1) !important;
                        z-index: 1000 !important;
                        cursor: not-allowed !important;
                        pointer-events: all !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        font-size: 12px !important;
                        color: #dc3545 !important;
                        font-weight: bold !important;
                    `;
                    overlay.innerHTML = '🚫 חסום - צפה ברמז';
                    
                    // Block clicks on overlay
                    overlay.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        log.info('🚫 Blocked click attempt');
                        return false;
                    }, true);
                    
                    item.appendChild(overlay);
                }
            });
            
            // Simple global event blocker
            const globalBlocker = (e) => {
                if (e.target.hasAttribute('data-quiz-blocked') || 
                    e.target.closest('[data-quiz-blocked]')) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    log.info(`🚫 Global block: ${e.type}`);
                    return false;
                }
            };
            
            // Store global blocker for clean removal
            this.globalBlockers = [];
            ['click', 'mousedown', 'change', 'keydown'].forEach(eventType => {
                document.addEventListener(eventType, globalBlocker, true);
                this.globalBlockers.push({ eventType, handler: globalBlocker });
            });
            
            this.isBlocked = true;
            log.info('🚫 Quiz inputs blocked successfully');
        },
        
        unblockQuizInputs() {
            log.info('🔓 Unblocking quiz inputs - clean restoration');
            
            // CRITICAL: Remove global event listeners first
            if (this.globalBlockers && this.globalBlockers.length > 0) {
                log.info(`Removing ${this.globalBlockers.length} global event listeners`);
                this.globalBlockers.forEach(blocker => {
                    document.removeEventListener(blocker.eventType, blocker.handler, true);
                });
                this.globalBlockers = [];
            }
            
            // Remove all blocking attributes and restore original state
            const blockedElements = document.querySelectorAll('[data-quiz-blocked]');
            blockedElements.forEach(element => {
                element.removeAttribute('data-quiz-blocked');
                element.style.pointerEvents = '';
                element.style.opacity = '';
                element.style.cursor = '';
                
                // Remove overlays
                const overlay = element.querySelector('.quiz-block-overlay');
                if (overlay) {
                    overlay.remove();
                }
            });
            
            // Re-enable inputs specifically
            const inputs = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
            inputs.forEach(input => {
                input.disabled = false;
                input.style.pointerEvents = '';
                input.style.opacity = '';
                input.style.cursor = '';
            });
            
            this.isBlocked = false;
            state.hintViewed = true;
            log.info('✅ Quiz inputs fully unblocked and restored');
        },
        
        showHintMessage() {
            // Remove any existing hint messages
            document.querySelectorAll('.lilac-hint-message').forEach(msg => msg.remove());
            
            // Find the quiz container
            const quizContainer = document.querySelector('.wpProQuiz_listItem, .wpProQuiz_content');
            if (!quizContainer) return;
            
            // Create hint message box
            const hintMessage = document.createElement('div');
            hintMessage.className = 'lilac-hint-message';
            hintMessage.style.cssText = `
                background: #fff3cd !important;
                border: 2px solid #ffc107 !important;
                border-radius: 8px !important;
                padding: 15px 20px !important;
                margin: 15px 0 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                direction: rtl !important;
                text-align: right !important;
                font-family: Arial, sans-serif !important;
                z-index: 1001 !important;
                position: relative !important;
            `;
            
            hintMessage.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; color: #856404; font-weight: bold; font-size: 16px;">
                    <span style="color: #ffc107; font-size: 18px;">💡</span>
                    <span>תשובה שגויה! צפה ברמז כדי להמשיך</span>
                </div>
                <button class="lilac-force-hint" style="
                    background: #ffc107 !important;
                    color: #212529 !important;
                    border: none !important;
                    border-radius: 6px !important;
                    padding: 10px 20px !important;
                    font-size: 16px !important;
                    font-weight: bold !important;
                    cursor: pointer !important;
                    transition: background-color 0.3s !important;
                    min-width: 80px !important;
                ">רמז</button>
            `;
            
            // Insert hint message
            const firstButton = quizContainer.querySelector('input.wpProQuiz_button');
            if (firstButton) {
                firstButton.parentNode.insertBefore(hintMessage, firstButton);
            } else {
                quizContainer.appendChild(hintMessage);
            }
            
            log.info('💡 Hint message displayed');
        },
        
        setupHintHandlers() {
            log.info('🔧 Setting up hint button handlers');
            
            // Handle hint button clicks - both native and custom
            $(document).on('click', '.wpProQuiz_button[name="tip"], .wpProQuiz_TipButton, .lilac-force-hint', (e) => {
                e.preventDefault();
                log.info('💡 Hint button clicked');
                
                const $question = $(e.target).closest('.wpProQuiz_listItem');
                this.showHintModal($question);
                
                return false;
            });
        },
        
        showHintModal($question) {
            log.info('💡 Showing hint modal');
            
            // First click the actual hint button to reveal hint content
            const hintButton = $question.find('.wpProQuiz_TipButton')[0];
            let hintText = 'טוען רמז...';
            
            if (hintButton) {
                hintButton.click();
                
                // Wait for hint content to be revealed
                setTimeout(() => {
                    const hintContainer = $question.find('.wpProQuiz_tipp');
                    if (hintContainer.length) {
                        const hintContent = hintContainer.find('p');
                        if (hintContent.length) {
                            hintText = hintContent.text().trim();
                        } else {
                            hintText = hintContainer.text().trim() || 'רמז לא נמצא';
                        }
                        
                        // Update modal content if it exists
                        const modalContent = $('#lilac-hint-modal .modal-content p');
                        if (modalContent.length) {
                            modalContent.text(hintText);
                        }
                    }
                }, 200);
            }
            
            // Create modal if it doesn't exist
            let modal = $('#lilac-hint-modal');
            if (!modal.length) {
                modal = $(`
                    <div id="lilac-hint-modal" style="
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        background: rgba(0,0,0,0.6) !important;
                        z-index: 10000 !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                    ">
                        <div class="modal-content" style="
                            background: white !important;
                            padding: 30px !important;
                            border-radius: 10px !important;
                            max-width: 600px !important;
                            width: 45% !important;
                            min-width: 400px !important;
                            direction: rtl !important;
                            text-align: right !important;
                            font-family: Arial, sans-serif !important;
                            position: relative !important;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
                            max-height: 80vh !important;
                            overflow-y: auto !important;
                        ">
                            <button class="close-modal" style="
                                position: absolute !important;
                                top: 15px !important;
                                right: 15px !important;
                                background: #dc3545 !important;
                                color: white !important;
                                border: none !important;
                                width: 35px !important;
                                height: 35px !important;
                                cursor: pointer !important;
                                font-size: 20px !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                border-radius: 50% !important;
                                transition: background-color 0.2s ease !important;
                            ">×</button>
                            <p style="
                                font-size: 16px !important;
                                line-height: 1.5 !important;
                                color: #555 !important;
                                margin-top: 20px !important;
                            ">${hintText}</p>
                        </div>
                    </div>
                `);
                
                $('body').append(modal);
                
                // Close modal handlers
                modal.find('.close-modal').on('click', () => {
                    modal.hide();
                    this.onHintModalClosed();
                });
                
                modal.on('click', (e) => {
                    if (e.target === modal[0]) {
                        modal.hide();
                        this.onHintModalClosed();
                    }
                });
            }
            
            modal.show();
            log.info('💡 Hint modal displayed');
        },
        
        onHintModalClosed() {
            log.info('🔓 Hint modal closed - unblocking inputs');
            
            // Unblock all quiz inputs
            this.unblockQuizInputs();
            
            // Update hint message to show success
            const hintMessage = document.querySelector('.lilac-hint-message');
            if (hintMessage) {
                hintMessage.style.background = '#d4edda !important';
                hintMessage.style.borderColor = '#28a745 !important';
                hintMessage.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px; color: #155724; font-weight: bold; font-size: 16px; width: 100%;">
                        <span style="color: #28a745; font-size: 18px;">✅</span>
                        <span>רמז נצפה! כעת ניתן לבחור תשובה חדשה</span>
                    </div>
                `;
            }
            
            log.info('✅ Hint viewed - inputs fully restored and ready for reselection');
        }
    };
    
    /**
     * Initialize the system when DOM is ready
     */
    $(document).ready(function() {
        log.info('🚀 Initializing repaired hint enforcement system');
        QuizBlocker.init();
        
        // Expose for debugging
        window.QuizBlocker = QuizBlocker;
        window.QuizBlockerState = state;
        
        log.info('✅ Repaired hint enforcement system fully initialized');
    });
    
})(jQuery);
