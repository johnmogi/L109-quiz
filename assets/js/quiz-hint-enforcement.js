/**
 * LearnDash Quiz - Answer Reselection with Hint Enforcement
 * 
 * Enables users to reselect and submit answers after incorrect submission
 * Part of the Enforce Hint feature for the Lilac Quiz Sidebar plugin
 * Enhanced with modal hint display and correct answer detection
 */
(function($) {
    'use strict';
    
    // Configuration
    const config = {
        debug: true,
        enforceHintDelay: 300,
        observerDelay: 500,
        tooltipText: 'טעית! להמשך חובה לקחת רמז!',
        answerDetection: true,
        maxIterations: 5, // Safety limit for loops
        aggressiveBlocking: true
    };
    
    // State management
    const state = {
        hintViewed: false,
        canProceed: false,
        currentQuestion: null,
        blockingActive: false,
        mutationCount: 0,
        timeoutIds: [],
        intervalIds: []
    };
    
    // Debug logger
    const log = {
        info: function(message, data) {
            if (config.debug) {
                const prefix = '%c[HINT] ';
                const style = 'color: #007700;';
                if (data) {
                    console.log(prefix + message, style, data);
                } else {
                    console.log(prefix + message, style);
                }
            }
        },
        error: function(message, data) {
            const prefix = '%c[HINT ERROR] ';
            const style = 'color: #c62828;';
            if (data) {
                console.error(prefix + message, style, data);
            } else {
                console.error(prefix + message, style);
            }
        }
    };
    
    log.info('Quiz hint enforcement script loaded successfully - VERSION 2.0 AGGRESSIVE BLOCKING');
    console.log('%c🔥 AGGRESSIVE BLOCKING SYSTEM LOADED - VERSION 2.0', 'color: red; font-size: 16px; font-weight: bold;');
    
    /**
     * AGGRESSIVE JavaScript-only blocking system with safety limits
     */
    const AggressiveBlocker = {
        init() {
            log.info('🔥 AGGRESSIVE: System ready (observer will activate only when blocking needed)');
            // Don't setup observer or safety limits on init - only when activate() is called
        },
        
        setupSafetyLimits() {
            // Clear any existing timeouts/intervals to prevent loops
            state.timeoutIds.forEach(id => clearTimeout(id));
            state.intervalIds.forEach(id => clearInterval(id));
            state.timeoutIds = [];
            state.intervalIds = [];
            state.mutationCount = 0;
            log.info('🔥 AGGRESSIVE: Safety limits initialized');
        },
        
        safeTimeout(callback, delay) {
            if (state.timeoutIds.length >= config.maxIterations) {
                log.error('🔥 AGGRESSIVE: Max timeouts reached, blocking new timeout');
                return null;
            }
            const id = setTimeout(() => {
                callback();
                // Remove from tracking array
                state.timeoutIds = state.timeoutIds.filter(timeoutId => timeoutId !== id);
            }, delay);
            state.timeoutIds.push(id);
            return id;
        },
        
        setupMutationObserver() {
            // Only setup observer when blocking is actually active
            if (!state.blockingActive) {
                log.info('🔥 AGGRESSIVE: Blocking not active, skipping observer setup');
                return;
            }
            
            // Disconnect existing observer
            if (window._aggressiveObserver) {
                window._aggressiveObserver.disconnect();
                log.info('🔥 AGGRESSIVE: Disconnected existing observer');
            }
            
            // Reset mutation count when setting up new observer
            state.mutationCount = 0;
            
            const observer = new MutationObserver((mutations) => {
                if (!state.blockingActive) {
                    log.info('🔥 AGGRESSIVE: Blocking deactivated, ignoring mutations');
                    return;
                }
                
                if (state.mutationCount >= config.maxIterations) {
                    log.error('🔥 AGGRESSIVE: Max mutations reached, disconnecting observer');
                    observer.disconnect();
                    window._aggressiveObserver = null;
                    return;
                }
                
                state.mutationCount++;
                log.info(`🔥 AGGRESSIVE: Mutation ${state.mutationCount}/${config.maxIterations}`);
                
                let shouldEnforce = false;
                mutations.forEach((mutation) => {
                    // Only check for specific quiz-related changes
                    if (mutation.target.matches && 
                        (mutation.target.matches('.wpProQuiz_questionListItem input') ||
                         mutation.target.closest('.wpProQuiz_questionListItem'))) {
                        // Check if disabled attribute or data-blocked was removed
                        if (mutation.type === 'attributes' && 
                            (mutation.attributeName === 'disabled' || 
                             mutation.attributeName === 'data-blocked-aggressive')) {
                            shouldEnforce = true;
                            log.info('🔥 AGGRESSIVE: Quiz input attributes changed, need to re-enforce');
                        }
                    }
                });
                
                if (shouldEnforce) {
                    log.info('🔥 AGGRESSIVE: Re-enforcing blocks due to DOM mutation');
                    this.safeTimeout(() => this.enforceBlocking(), 50);
                }
            });
            
            observer.observe(document.body, {
                childList: false, // Don't watch for new elements
                subtree: true,
                attributes: true,
                attributeFilter: ['disabled', 'data-blocked-aggressive'] // Only watch specific attributes
            });
            
            window._aggressiveObserver = observer;
            log.info('🔥 AGGRESSIVE: Mutation observer active (selective)');
        },
        
        enforceBlocking() {
            if (!state.blockingActive) return;
            
            log.info('🔥 AGGRESSIVE: ENFORCING COMPLETE BLOCKING');
            
            // Find all quiz inputs
            const inputs = document.querySelectorAll('.wpProQuiz_questionListItem input[type="radio"], .wpProQuiz_questionListItem input[type="checkbox"]');
            
            inputs.forEach((input, index) => {
                log.info(`🔥 AGGRESSIVE: Blocking input ${index + 1}`);
                
                // NUCLEAR option - completely destroy functionality
                input.disabled = true;
                input.readOnly = true;
                input.style.pointerEvents = 'none';
                input.style.opacity = '0.3';
                input.style.cursor = 'not-allowed';
                input.setAttribute('data-blocked-aggressive', 'true');
                input.setAttribute('tabindex', '-1');
                
                // Remove checked state
                input.checked = false;
                
                // Block ALL possible events
                const blockAllEvents = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    log.info(`🔥 AGGRESSIVE: BLOCKED ${e.type} on input ${index + 1}`);
                    return false;
                };
                
                // Comprehensive event list
                const allEvents = [
                    'click', 'mousedown', 'mouseup', 'mouseover', 'mouseout',
                    'change', 'input', 'focus', 'blur', 'select',
                    'keydown', 'keyup', 'keypress',
                    'touchstart', 'touchend', 'touchmove',
                    'dragstart', 'drop', 'dragover'
                ];
                
                // Remove existing listeners first
                if (input._aggressiveBlockers) {
                    allEvents.forEach(eventType => {
                        input.removeEventListener(eventType, input._aggressiveBlockers, true);
                    });
                }
                
                // Add new blockers
                allEvents.forEach(eventType => {
                    input.addEventListener(eventType, blockAllEvents, true);
                });
                
                input._aggressiveBlockers = blockAllEvents;
                
                // Block the container too
                const container = input.closest('.wpProQuiz_questionListItem');
                if (container) {
                    container.style.pointerEvents = 'none';
                    container.style.opacity = '0.4';
                    container.style.cursor = 'not-allowed';
                    container.setAttribute('data-blocked-aggressive', 'true');
                    
                    // Add visual blocking overlay
                    let overlay = container.querySelector('.aggressive-block-overlay');
                    if (!overlay) {
                        overlay = document.createElement('div');
                        overlay.className = 'aggressive-block-overlay';
                        overlay.style.cssText = `
                            position: absolute !important;
                            top: 0 !important;
                            left: 0 !important;
                            right: 0 !important;
                            bottom: 0 !important;
                            background: rgba(255, 0, 0, 0.1) !important;
                            z-index: 999999 !important;
                            cursor: not-allowed !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            font-weight: bold !important;
                            color: #dc3545 !important;
                            font-size: 12px !important;
                            pointer-events: all !important;
                        `;
                        overlay.innerHTML = '🚫 BLOCKED';
                        
                        // Block overlay events too
                        allEvents.forEach(eventType => {
                            overlay.addEventListener(eventType, blockAllEvents, true);
                        });
                        
                        container.style.position = 'relative';
                        container.appendChild(overlay);
                    }
                }
            });
            
            // Global document-level event blocking
            this.setupGlobalBlocking();
            
            log.info('🔥 AGGRESSIVE: COMPLETE BLOCKING ENFORCED');
        },
        
        setupGlobalBlocking() {
            const globalBlocker = (e) => {
                const target = e.target;
                
                // Check if target is a blocked input or inside blocked container
                if (target.hasAttribute('data-blocked-aggressive') ||
                    target.closest('[data-blocked-aggressive]') ||
                    target.matches('.wpProQuiz_questionListItem input') ||
                    target.closest('.wpProQuiz_questionListItem')) {
                    
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    log.info(`🔥 AGGRESSIVE: GLOBAL BLOCK on ${e.type}`);
                    return false;
                }
            };
            
            // Remove existing global blocker
            if (window._globalAggressiveBlocker) {
                const events = ['click', 'mousedown', 'change', 'keydown', 'touchstart'];
                events.forEach(eventType => {
                    document.removeEventListener(eventType, window._globalAggressiveBlocker, true);
                });
            }
            
            // Add new global blocker
            const events = ['click', 'mousedown', 'change', 'keydown', 'touchstart'];
            events.forEach(eventType => {
                document.addEventListener(eventType, globalBlocker, true);
            });
            
            window._globalAggressiveBlocker = globalBlocker;
            log.info('🔥 AGGRESSIVE: Global blocking active');
        },
        
        activate() {
            log.info('🔥 AGGRESSIVE: ACTIVATING BLOCKING');
            state.blockingActive = true;
            
            // Initialize safety limits and setup observer ONLY when activating
            this.setupSafetyLimits();
            this.setupMutationObserver();
            
            // Initial blocking enforcement
            this.enforceBlocking();
            
            // Re-enforce every 100ms for first 500ms (max 5 times due to safety)
            let enforceCount = 0;
            const enforceInterval = setInterval(() => {
                if (enforceCount >= config.maxIterations || !state.blockingActive) {
                    clearInterval(enforceInterval);
                    return;
                }
                enforceCount++;
                log.info(`🔥 AGGRESSIVE: Re-enforce ${enforceCount}/${config.maxIterations}`);
                this.enforceBlocking();
            }, 100);
            
            state.intervalIds.push(enforceInterval);
        },
        
        deactivate() {
            log.info('🔥 AGGRESSIVE: DEACTIVATING BLOCKING');
            state.blockingActive = false;
            
            // Clear all timeouts and intervals
            state.timeoutIds.forEach(id => clearTimeout(id));
            state.intervalIds.forEach(id => clearInterval(id));
            state.timeoutIds = [];
            state.intervalIds = [];
            
            // Remove global blocker
            if (window._globalAggressiveBlocker) {
                const events = ['click', 'mousedown', 'change', 'keydown', 'touchstart'];
                events.forEach(eventType => {
                    document.removeEventListener(eventType, window._globalAggressiveBlocker, true);
                });
                window._globalAggressiveBlocker = null;
            }
            
            // Remove all blocking attributes and overlays
            const blockedElements = document.querySelectorAll('[data-blocked-aggressive]');
            blockedElements.forEach(element => {
                element.removeAttribute('data-blocked-aggressive');
                element.style.pointerEvents = '';
                element.style.opacity = '';
                element.style.cursor = '';
                
                const overlay = element.querySelector('.aggressive-block-overlay');
                if (overlay) {
                    overlay.remove();
                }
            });
            
            log.info('🔥 AGGRESSIVE: BLOCKING DEACTIVATED');
        }
    };
    
    // Initialize aggressive blocker system (but don't activate observer until needed)
    AggressiveBlocker.init();
    
    /**
     * SIMPLE: Watch for error message and block immediately
     */
    const SimpleBlocker = {
        isBlocked: false,
        globalBlockers: [], // Store references to global event listeners
        
        init() {
            console.log('%c🔥 SIMPLE BLOCKER INITIALIZED', 'color: orange; font-weight: bold;');
            this.watchForErrorMessage();
            this.watchForHintButton();
        },
        
        watchForErrorMessage() {
            console.log('%c👀 WATCHING FOR ERROR MESSAGES', 'color: blue; font-weight: bold;');
            
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        // Only check newly added nodes, not all elements
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                // Check the added element and its children for error messages
                                const elementsToCheck = [node, ...node.querySelectorAll('*')];
                                elementsToCheck.forEach(element => {
                                    const elementText = element.textContent || '';
                                    // Only look for specific error message that appears after wrong answer
                                    if (elementText.trim() === 'תשובה לא נכונה' || 
                                        (elementText.includes('תשובה לא נכונה') && elementText.includes('רמז'))) {
                                        
                                        // Make sure this is a visible error message
                                        const computedStyle = window.getComputedStyle(element);
                                        if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
                                            console.log('%c🚫 ERROR MESSAGE DETECTED:', 'color: red; font-size: 14px; font-weight: bold;', elementText.trim());
                                            this.blockQuizInputs();
                                            this.watchForHintButton();
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
            
            // Don't check immediately on page load - only after user interaction
            console.log('%c👀 Error detection ready - waiting for quiz submission', 'color: blue; font-weight: bold;');
        },
        
        blockQuizInputs() {
            console.log('%c🚫 BLOCKING QUIZ INPUTS', 'color: red; font-weight: bold;');
            
            // Find the quiz container
            const quizContainer = document.querySelector('.wpProQuiz_questionList, .wpProQuiz_question');
            if (!quizContainer) {
                console.log('❌ Quiz container not found');
                return;
            }
            
            // Block all inputs in the quiz
            const inputs = quizContainer.querySelectorAll('input[type="radio"], input[type="checkbox"]');
            const labels = quizContainer.querySelectorAll('label');
            const questionItems = quizContainer.querySelectorAll('.wpProQuiz_questionListItem');
            
            console.log(`🚫 Found ${inputs.length} inputs, ${labels.length} labels, ${questionItems.length} items to block`);
            
            // Block inputs
            inputs.forEach((input, index) => {
                input.disabled = true;
                input.style.pointerEvents = 'none';
                input.style.opacity = '0.3';
                input.style.cursor = 'not-allowed';
                input.setAttribute('data-simple-blocked', 'true');
                console.log(`🚫 Blocked input ${index + 1}`);
            });
            
            // Block labels
            labels.forEach((label, index) => {
                label.style.pointerEvents = 'none';
                label.style.cursor = 'not-allowed';
                label.style.opacity = '0.5';
                label.setAttribute('data-simple-blocked', 'true');
                console.log(`🚫 Blocked label ${index + 1}`);
            });
            
            // Block question items with overlay
            questionItems.forEach((item, index) => {
                item.style.position = 'relative';
                item.style.pointerEvents = 'none';
                item.style.cursor = 'not-allowed';
                item.setAttribute('data-simple-blocked', 'true');
                
                // Add visual overlay
                if (!item.querySelector('.simple-block-overlay')) {
                    const overlay = document.createElement('div');
                    overlay.className = 'simple-block-overlay';
                    overlay.style.cssText = `
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                        background: rgba(200, 200, 200, 0.7) !important;
                        z-index: 9999 !important;
                        cursor: not-allowed !important;
                        pointer-events: all !important;
                    `;
                    overlay.innerHTML = '';
                    
                    // Block all events on overlay
                    overlay.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🚫 BLOCKED CLICK ATTEMPT');
                        return false;
                    }, true);
                    
                    item.appendChild(overlay);
                }
                
                console.log(`🚫 Blocked question item ${index + 1}`);
            });
            
            // Global event blocker for this quiz
            const globalBlocker = (e) => {
                if (e.target.hasAttribute('data-simple-blocked') || 
                    e.target.closest('[data-simple-blocked]') ||
                    e.target.closest('.wpProQuiz_questionListItem')) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    console.log(`🚫 GLOBAL BLOCK: ${e.type}`);
                    return false;
                }
            };
            
            // Store global blocker references for later removal
            this.globalBlockers = [];
            ['click', 'mousedown', 'change', 'keydown'].forEach(eventType => {
                document.addEventListener(eventType, globalBlocker, true);
                this.globalBlockers.push({ eventType, handler: globalBlocker });
            });
            
            this.isBlocked = true;
            console.log('🚫 QUIZ INPUTS COMPLETELY BLOCKED');
        },
        
        unblockQuizInputs() {
            console.log('%c✅ UNBLOCKING QUIZ INPUTS', 'color: green; font-weight: bold;');
            
            // CRITICAL: Remove all global event listeners first
            if (this.globalBlockers && this.globalBlockers.length > 0) {
                console.log(`🔓 Removing ${this.globalBlockers.length} global event listeners`);
                this.globalBlockers.forEach(blocker => {
                    document.removeEventListener(blocker.eventType, blocker.handler, true);
                    console.log(`🔓 Removed ${blocker.eventType} listener`);
                });
                this.globalBlockers = [];
            }
            
            // Remove all blocking attributes and overlays
            const blockedElements = document.querySelectorAll('[data-simple-blocked]');
            blockedElements.forEach(element => {
                element.removeAttribute('data-simple-blocked');
                element.style.pointerEvents = '';
                element.style.opacity = '';
                element.style.cursor = '';
                
                // Remove overlays
                const overlay = element.querySelector('.simple-block-overlay');
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
            console.log('✅ QUIZ INPUTS FULLY UNBLOCKED - INPUTS SHOULD NOW BE SELECTABLE');
        },
        
        watchForHintButton() {
            console.log('%c👀 WATCHING FOR HINT BUTTON CLICKS', 'color: blue; font-weight: bold;');
            
            // Watch for hint button clicks
            const hintButtons = document.querySelectorAll('.lilac-force-hint, button[class*="hint"]');
            hintButtons.forEach(button => {
                if (button.textContent.includes('רמז')) {
                    button.addEventListener('click', () => {
                        console.log('%c🔓 HINT BUTTON CLICKED - WILL UNBLOCK AFTER MODAL CLOSES', 'color: green; font-weight: bold;');
                        
                        // Wait for modal to appear and then watch for its closure
                        setTimeout(() => {
                            this.watchForModalClose();
                        }, 500);
                    });
                }
            });
            
            // Also use event delegation for dynamically added buttons
            document.addEventListener('click', (e) => {
                if (e.target.matches('.lilac-force-hint') || 
                    (e.target.textContent && e.target.textContent.includes('רמז'))) {
                    console.log('%c🔓 HINT BUTTON CLICKED (DELEGATED) - WILL UNBLOCK AFTER MODAL CLOSES', 'color: green; font-weight: bold;');
                    
                    setTimeout(() => {
                        this.watchForModalClose();
                    }, 500);
                }
            });
        },
        
        watchForModalClose() {
            console.log('%c👀 WATCHING FOR MODAL CLOSE', 'color: blue; font-weight: bold;');
            
            // Watch for modal close events
            const modal = document.getElementById('lilac-hint-modal');
            if (modal) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                            if (modal.style.display === 'none' || !modal.style.display) {
                                console.log('%c🔓 MODAL CLOSED - UNBLOCKING NOW', 'color: green; font-weight: bold;');
                                this.unblockQuizInputs();
                                observer.disconnect();
                            }
                        }
                    });
                });
                
                observer.observe(modal, {
                    attributes: true,
                    attributeFilter: ['style']
                });
            }
            
            // Also watch for success message indicating hint was viewed
            const successObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' || mutation.type === 'attributes') {
                        const successMessages = document.querySelectorAll('.lilac-hint-message');
                        successMessages.forEach(message => {
                            const messageText = message.textContent || '';
                            if (messageText.includes('רמז נצפה') || messageText.includes('כעת ניתן לבחור')) {
                                console.log('%c🔓 SUCCESS MESSAGE DETECTED - UNBLOCKING NOW', 'color: green; font-weight: bold;');
                                this.unblockQuizInputs();
                                successObserver.disconnect();
                            }
                        });
                    }
                });
            });
            
            successObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true
            });
        }
    };
    
    // Initialize simple blocker
    SimpleBlocker.init();
    
    /**
     * Check if answer is correct using debugger data
     */
    function checkAnswerFromDebuggerData(selectedIndex) {
        if (window.quizDetector && window.quizDetector.correctAnswers) {
            const correctAnswers = window.quizDetector.correctAnswers;
            if (correctAnswers.answers && Array.isArray(correctAnswers.answers)) {
                const correctAnswer = correctAnswers.answers.find(answer => answer.correct === true);
                if (correctAnswer) {
                    log.info('🎯 Debugger data - Correct answer index:', correctAnswer.index);
                    log.info('🎯 Selected index:', selectedIndex);
                    log.info('🎯 Selected index type:', typeof selectedIndex);
                    
                    // Multiple comparison methods to handle different data types
                    if (correctAnswer.index == selectedIndex) return true;
                    if (parseInt(correctAnswer.index) === parseInt(selectedIndex)) return true;
                    if (String(correctAnswer.index) === String(selectedIndex)) return true;
                    
                    return false;
                }
            }
        }
        log.info('⚠️ No debugger data available for answer checking');
        return null;
    }
    
    /**
     * Check if answer is correct using DOM feedback
     */
    function checkAnswerFromDOM() {
        const feedbackElements = document.querySelectorAll('.wpProQuiz_response');
        for (let feedback of feedbackElements) {
            if (feedback.style.display !== 'none') {
                const isCorrect = feedback.classList.contains('wpProQuiz_correct') || 
                                feedback.textContent.includes('נכון') ||
                                feedback.textContent.includes('correct');
                log.info('📋 DOM feedback detected:', isCorrect ? 'Correct' : 'Incorrect');
                return isCorrect;
            }
        }
        return null;
    }
    
    /**
     * Show hint modal popup
     */
    function showHintModal() {
        // First click the actual hint button to reveal hint content
        const hintButton = document.querySelector('.wpProQuiz_TipButton');
        let hintText = 'טוען רמז...';
        
        if (hintButton) {
            hintButton.click();
            
            // Wait for hint content to be revealed
            setTimeout(() => {
                const hintContainer = hintButton.closest('.wpProQuiz_listItem');
                if (hintContainer) {
                    const revealedHint = hintContainer.querySelector('.wpProQuiz_tipp');
                    if (revealedHint) {
                        const hintContent = revealedHint.querySelector('p');
                        if (hintContent) {
                            hintText = hintContent.textContent.trim();
                            log.info('💡 Hint content found:', hintText);
                        } else {
                            const altHint = revealedHint.textContent.trim();
                            hintText = altHint || 'רמז לא נמצא';
                            log.info('💡 Alternative hint content:', hintText);
                        }
                        
                        // Update modal content
                        const modalContent = document.querySelector('#lilac-hint-modal .modal-content p');
                        if (modalContent) {
                            modalContent.textContent = hintText;
                        }
                    } else {
                        hintText = 'לא נמצא רמז לשאלה זו';
                        log.info('⚠️ No hint container found');
                    }
                }
            }, 200);
        } else {
            hintText = 'כפתור הרמז לא נמצא';
            log.info('⚠️ Hint button not found');
        }
        
        // Create modal if it doesn't exist
        let modal = document.getElementById('lilac-hint-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'lilac-hint-modal';
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 10000; display: flex; align-items: center; justify-content: center;';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            modalContent.style.cssText = 'background: white; padding: 30px; border-radius: 10px; max-width: 600px; width: 45%; min-width: 400px; direction: rtl; text-align: right; font-family: Arial, sans-serif; position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.3); max-height: 80vh; overflow-y: auto;';
            
            modalContent.innerHTML = '<button class="close-modal" style="position: absolute; top: 15px; right: 15px; background: #dc3545; color: white; border: none; width: 35px; height: 35px; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background-color 0.2s ease;">×</button><p style="font-size: 16px; line-height: 1.5; color: #555; margin-top: 20px;">' + hintText + '</p>';
            
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // Close modal handlers
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.style.display = 'none';
                onHintModalClosed();
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    onHintModalClosed();
                }
            });
        }
        
        modal.style.display = 'flex';
        log.info('💡 Hint modal displayed');
    }
    
    /**
     * Handle hint modal closure - DEACTIVATE AGGRESSIVE BLOCKING
     */
    function onHintModalClosed() {
        log.info('🔓 Hint modal closed - DEACTIVATING AGGRESSIVE BLOCKING');
        
        // Deactivate aggressive blocking system
        AggressiveBlocker.deactivate();
        
        // Use the proven approach from reselection files - simple and effective
        enableAllQuizInputs();
        
        // Remove global blockers
        if (window._globalInputBlocker) {
            const events = ['click', 'change', 'mousedown', 'mouseup', 'keydown', 'keyup', 'touchstart', 'touchend'];
            events.forEach(eventType => {
                document.removeEventListener(eventType, window._globalInputBlocker, true);
            });
            window._globalInputBlocker = null;
            log.info('🔓 Removed global input blocker');
        }
        
        // Disconnect blocking observer
        if (window._blockingObserver) {
            window._blockingObserver.disconnect();
            window._blockingObserver = null;
            log.info('🔓 Disconnected blocking observer');
        }
        
        // Update hint box to show inputs are now enabled - ENHANCED VERSION
        const hintBox = document.querySelector('.lilac-hint-message');
        if (hintBox) {
            // Make sure hint box is visible and styled properly
            hintBox.style.display = 'block !important';
            hintBox.style.visibility = 'visible !important';
            hintBox.style.background = '#d4edda !important';
            hintBox.style.borderColor = '#28a745 !important';
            hintBox.style.border = '2px solid #28a745 !important';
            hintBox.style.padding = '15px !important';
            hintBox.style.marginTop = '10px !important';
            hintBox.style.borderRadius = '8px !important';
            hintBox.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; color: #155724; font-weight: bold; font-size: 16px; width: 100%;">
                    <span style="color: #28a745; font-size: 18px;">✓</span>
                    <span>רמז נצפה! כעת ניתן לבחור תשובה חדשה</span>
                </div>
            `;
            log.info('✅ Hint box updated and kept visible for user');
        } else {
            log.warn('⚠️ Hint box not found - may have been removed');
            // Try to recreate hint box if it was removed
            const questionContainer = document.querySelector('.wpProQuiz_listItem');
            if (questionContainer) {
                const newHintBox = document.createElement('div');
                newHintBox.className = 'lilac-hint-message';
                newHintBox.style.cssText = 'display: block !important; visibility: visible !important; background: #d4edda !important; border: 2px solid #28a745 !important; padding: 15px !important; margin-top: 10px !important; border-radius: 8px !important;';
                newHintBox.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px; color: #155724; font-weight: bold; font-size: 16px; width: 100%;">
                        <span style="color: #28a745; font-size: 18px;">✓</span>
                        <span>רמז נצפה! כעת ניתן לבחור תשובה חדשה</span>
                    </div>
                `;
                questionContainer.appendChild(newHintBox);
                log.info('✅ Recreated hint box for user visibility');
            }
        }
        
        log.info('✅ ALL BLOCKING COMPLETELY REMOVED - INPUTS FULLY RESTORED');
    }
    
    /**
     * Enable all quiz inputs using enhanced approach for full interactivity
     * KEEP HINT BOX VISIBLE - DO NOT REMOVE IT
     */
    function enableAllQuizInputs() {
        log.info('🔓 Enabling all quiz inputs using ENHANCED approach for full interactivity');
        
        // Find the current question that was blocked
        const $questions = $('.wpProQuiz_listItem');
        
        $questions.each(function() {
            const $question = $(this);
            
            // Remove ALL blocking classes and attributes
            $question.removeClass('lilac-locked blocked disabled');
            $question.removeAttr('data-blocked data-blocked-aggressive data-disabled');
            
            // DO NOT REMOVE HINT MESSAGE - KEEP IT VISIBLE FOR USER
            // $question.find('.lilac-hint-message').remove(); // COMMENTED OUT
            
            // ENHANCED: Re-enable answer selection with comprehensive approach
            const $inputs = $question.find('.wpProQuiz_questionInput');
            const $listItems = $question.find('.wpProQuiz_questionListItem');
            
            // Enable inputs completely
            $inputs.each(function() {
                const input = this;
                $(input).prop('disabled', false);
                $(input).removeAttr('disabled data-blocked data-blocked-aggressive');
                
                // Remove any inline styles that might block interaction
                input.style.pointerEvents = 'auto';
                input.style.cursor = 'pointer';
                input.style.opacity = '1';
                input.style.visibility = 'visible';
                input.style.display = '';
                
                // Clear any event blocking
                $(input).off('.blocking');
            });
            
            // Enable list items completely
            $listItems.each(function() {
                const item = this;
                $(item).removeAttr('data-blocked data-blocked-aggressive disabled');
                $(item).removeClass('blocked disabled lilac-locked');
                
                // Reset all styles that could block interaction
                item.style.pointerEvents = 'auto';
                item.style.cursor = 'pointer';
                item.style.opacity = '1';
                item.style.visibility = 'visible';
                item.style.display = '';
                item.style.userSelect = 'auto';
                
                // Clear any event blocking
                $(item).off('.blocking');
            });
            
            // Remove ALL overlays and blocking elements
            $question.find('.disabled-overlay, .aggressive-block-overlay, .blocking-overlay').remove();
            
            // IMPORTANT: Clear any previous selection for fresh start
            $inputs.prop('checked', false);
            
            // Force re-bind click events if needed
            $inputs.each(function() {
                const $input = $(this);
                // Ensure click events work
                $input.on('click.reactivate', function(e) {
                    // Allow the click to proceed normally
                    e.stopPropagation();
                    return true;
                });
            });
        });
        
        // ADDITIONAL: Remove any global blocking that might interfere
        $('body').removeClass('quiz-blocked inputs-blocked');
        $(document).off('.quiz-blocking');
        
        log.info('🔓 ENHANCED: All quiz inputs fully enabled and interactive - HINT BOX KEPT VISIBLE');
    }
    
    // Expose onHintModalClosed globally for debugging and external access
    window.onHintModalClosed = onHintModalClosed;
    
    /**
     * Show inline hint message under each quiz question
     */
    function showInlineHintMessage() {
        // Find all quiz questions
        const questions = document.querySelectorAll('.wpProQuiz_listItem');
        
        questions.forEach((question, index) => {
            // Remove existing hint message for this question
            const existing = question.querySelector('.lilac-hint-message');
            if (existing) {
                existing.remove();
            }
            
            // Hide the original hint content
            const originalHint = question.querySelector('.wpProQuiz_tipp');
            if (originalHint) {
                originalHint.style.display = 'none';
                originalHint.style.visibility = 'hidden';
            }
            
            // Create hint message for this question
            const hintMessage = document.createElement('div');
            hintMessage.className = 'lilac-hint-message';
            hintMessage.style.cssText = 'background: #cce5ff; border: 2px solid #007bff; border-radius: 8px; padding: 15px 20px; display: flex; align-items: center; gap: 15px; direction: rtl; text-align: right; font-family: Arial, sans-serif; margin: 15px 0; width: 100%; box-sizing: border-box;';
            
            hintMessage.innerHTML = '<div style="display: flex; align-items: center; gap: 10px; color: #004085; font-weight: bold; font-size: 16px;"><span style="color: #007bff; font-size: 18px;">💡</span><span>צפייה ברמז</span></div><button class="lilac-force-hint" style="background: #007bff; color: white; border: none; border-radius: 6px; padding: 10px 20px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background-color 0.3s; min-width: 80px;">רמז</button>';
            
            // Add click handler for hint button
            const hintButton = hintMessage.querySelector('.lilac-force-hint');
            if (hintButton) {
                hintButton.addEventListener('click', () => {
                    showHintModal();
                    state.hintViewed = true;
                    log.info('💡 Hint viewed for question', index + 1);
                });
            }
            
            // Add hint message directly after the question
            question.appendChild(hintMessage);
        });
        
        log.info('📝 Inline hint messages displayed for', questions.length, 'questions');
    }
    
    /**
     * Show success indicator with next button
     */
    function showSuccessIndicator() {
        const existing = document.getElementById('lilac-hint-message');
        if (existing) {
            existing.remove();
        }
        
        const successMessage = document.createElement('div');
        successMessage.id = 'lilac-hint-message';
        successMessage.className = 'lilac-success-message';
        successMessage.style.cssText = 'background: #d4edda; border: 2px solid #28a745; border-radius: 8px; padding: 15px 20px; display: flex; align-items: center; gap: 15px; direction: rtl; text-align: right; font-family: Arial, sans-serif; margin: 20px auto; width: fit-content; max-width: 90%;';
        
        successMessage.innerHTML = '<div style="display: flex; align-items: center; gap: 10px; color: #155724; font-weight: bold; font-size: 16px;"><span style="color: #28a745; font-size: 18px;">✅</span><span>כל הכבוד! תשובה נכונה</span></div><button class="lilac-next-question" style="background: #28a745; color: white; border: none; border-radius: 6px; padding: 10px 20px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background-color 0.3s; min-width: 80px;">הבא</button>';
        
        // Add click handler for next button
        const nextButton = successMessage.querySelector('.lilac-next-question');
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                // Reset state for next question
                state.hintViewed = false;
                state.canProceed = false;
                successMessage.remove();
                log.info('➡️ Moving to next question - state reset');
            });
        }
        
        // Add to page
        const quizContainer = document.querySelector('.wpProQuiz_content, .quiz-content, .learndash-quiz-content, .wpProQuiz_quiz');
        if (quizContainer) {
            quizContainer.appendChild(successMessage);
        } else {
            document.body.appendChild(successMessage);
        }
        
        log.info('✅ Success indicator displayed');
    }
    
    /**
     * AGGRESSIVE: Disable answer inputs after wrong answer with safety limits
     */
    function disableAnswerInputs() {
        log.info('🚫 AGGRESSIVE: Starting disableAnswerInputs function');
        
        // Safety counter to prevent infinite loops
        let iterations = 0;
        const maxIterations = config.maxIterations;
        
        const aggressiveBlock = () => {
            if (iterations >= maxIterations) {
                log.error('🚫 Max iterations reached, stopping aggressive blocking');
                return;
            }
            iterations++;
            
            log.info(`🚫 AGGRESSIVE: Iteration ${iterations}/${maxIterations}`);
            
            // Add quiz-container class if not present
            const quizContainer = document.querySelector('.wpProQuiz_content, .learndash-quiz-content');
            if (quizContainer && !quizContainer.classList.contains('quiz-container')) {
                quizContainer.classList.add('quiz-container');
                log.info('🚫 Added quiz-container class');
            }
            
            const inputs = document.querySelectorAll('.wpProQuiz_questionListItem input[type="radio"], .wpProQuiz_questionListItem input[type="checkbox"]');
            log.info('🚫 Found inputs to disable:', inputs.length);
            
            inputs.forEach((input, index) => {
                log.info(`🚫 AGGRESSIVE: Processing input ${index + 1}:`, input);
                
                // Multiple blocking methods - AGGRESSIVE
                input.disabled = true;
                input.style.opacity = '0.3';
                input.style.pointerEvents = 'none';
                input.style.cursor = 'not-allowed';
                input.setAttribute('readonly', 'readonly');
                input.setAttribute('data-blocked', 'true');
                input.setAttribute('tabindex', '-1');
                
                // Remove any existing checked state
                input.checked = false;
                
                // AGGRESSIVE event blockers
                const blockEvent = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    log.info('🚫 AGGRESSIVE: Blocked interaction attempt on', e.type);
                    return false;
                };
                
                // Remove existing listeners first
                if (input._blockHandlers) {
                    input._blockHandlers.forEach(handler => {
                        input.removeEventListener('click', handler, true);
                        input.removeEventListener('change', handler, true);
                        input.removeEventListener('mousedown', handler, true);
                        input.removeEventListener('mouseup', handler, true);
                        input.removeEventListener('focus', handler, true);
                        input.removeEventListener('keydown', handler, true);
                        input.removeEventListener('keyup', handler, true);
                    });
                }
                
                // Add comprehensive event blockers
                const events = ['click', 'change', 'mousedown', 'mouseup', 'focus', 'keydown', 'keyup', 'touchstart', 'touchend'];
                events.forEach(eventType => {
                    input.addEventListener(eventType, blockEvent, true);
                });
                
                // Store blockers for removal later
                input._blockHandlers = [blockEvent];
                
                // AGGRESSIVE visual feedback to parent container
                const container = input.closest('.wpProQuiz_questionListItem');
                if (container) {
                    container.style.position = 'relative';
                    container.style.opacity = '0.5';
                    container.style.pointerEvents = 'none';
                    container.style.cursor = 'not-allowed';
                    container.setAttribute('data-blocked', 'true');
                    
                    // Add aggressive overlay
                    const existingOverlay = container.querySelector('.disabled-overlay');
                    if (existingOverlay) {
                        existingOverlay.remove();
                    }
                    
                    const overlay = document.createElement('div');
                    overlay.className = 'disabled-overlay';
                    overlay.style.cssText = `
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                        background: rgba(255, 255, 255, 0.9) !important;
                        z-index: 99999 !important;
                        cursor: not-allowed !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        font-weight: bold !important;
                        color: #dc3545 !important;
                        font-size: 14px !important;
                        text-align: center !important;
                        padding: 10px !important;
                        pointer-events: all !important;
                        user-select: none !important;
                    `;
                    overlay.innerHTML = '🚫 חסום - יש לצפות ברמז';
                    
                    // Block all events on overlay
                    events.forEach(eventType => {
                        overlay.addEventListener(eventType, blockEvent, true);
                    });
                    
                    container.appendChild(overlay);
                }
            });
            
            // AGGRESSIVE global event blocker
            const globalBlocker = (e) => {
                const target = e.target;
                if (target.matches('input[type="radio"][data-blocked], input[type="checkbox"][data-blocked]') ||
                    target.closest('.wpProQuiz_questionListItem[data-blocked]') ||
                    target.closest('.wpProQuiz_questionListItem input[data-blocked]')) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    log.info('🚫 AGGRESSIVE: Global blocked interaction attempt on', e.type);
                    return false;
                }
            };
            
            // Remove existing global blocker
            if (window._globalInputBlocker) {
                const events = ['click', 'change', 'mousedown', 'mouseup', 'keydown', 'keyup', 'touchstart', 'touchend'];
                events.forEach(eventType => {
                    document.removeEventListener(eventType, window._globalInputBlocker, true);
                });
            }
            
            // Add new global blocker
            const events = ['click', 'change', 'mousedown', 'mouseup', 'keydown', 'keyup', 'touchstart', 'touchend'];
            events.forEach(eventType => {
                document.addEventListener(eventType, globalBlocker, true);
            });
            
            // Store global blocker for removal
            window._globalInputBlocker = globalBlocker;
            
            log.info('🚫 AGGRESSIVE: Answer inputs completely blocked with multiple layers');
        };
        
        // Execute aggressive blocking
        aggressiveBlock();
        
        // Set up observer to re-apply blocking if DOM changes (with safety limit)
        if (config.aggressiveBlocking && iterations < maxIterations) {
            const observer = new MutationObserver((mutations) => {
                let shouldReapply = false;
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' || mutation.type === 'attributes') {
                        const hasQuizInputs = mutation.target.querySelector && 
                                            mutation.target.querySelector('.wpProQuiz_questionListItem input');
                        if (hasQuizInputs) {
                            shouldReapply = true;
                        }
                    }
                });
                
                if (shouldReapply && iterations < maxIterations) {
                    log.info('🚫 AGGRESSIVE: DOM changed, reapplying blocks');
                    setTimeout(aggressiveBlock, 100);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['disabled', 'data-blocked', 'style']
            });
            
            // Store observer for cleanup
            window._blockingObserver = observer;
            
            // Auto-disconnect after 30 seconds to prevent memory leaks
            setTimeout(() => {
                if (window._blockingObserver) {
                    window._blockingObserver.disconnect();
                    window._blockingObserver = null;
                    log.info('🚫 AGGRESSIVE: Observer auto-disconnected after 30s');
                }
            }, 30000);
        }
    }
    
    /**
     * Enable answer inputs after hint viewing
     */
    function enableAnswerInputs() {
        // Remove global event blocker first
        if (window._globalInputBlocker) {
            document.removeEventListener('click', window._globalInputBlocker, true);
            document.removeEventListener('change', window._globalInputBlocker, true);
            document.removeEventListener('mousedown', window._globalInputBlocker, true);
            window._globalInputBlocker = null;
        }
        
        const inputs = document.querySelectorAll('.wpProQuiz_questionListItem input[type="radio"], .wpProQuiz_questionListItem input[type="checkbox"]');
        inputs.forEach(input => {
            // Remove all blocking attributes and styles
            input.disabled = false;
            input.style.opacity = '1';
            input.style.pointerEvents = 'auto';
            input.removeAttribute('readonly');
            input.removeAttribute('data-blocked');
            
            // Remove individual event blockers
            if (input._blockHandlers) {
                input._blockHandlers.forEach(handler => {
                    input.removeEventListener('click', handler, true);
                    input.removeEventListener('change', handler, true);
                    input.removeEventListener('mousedown', handler, true);
                    input.removeEventListener('mouseup', handler, true);
                    input.removeEventListener('focus', handler, true);
                });
                input._blockHandlers = null;
            }
            
            // Remove visual feedback from parent container
            const container = input.closest('.wpProQuiz_questionListItem');
            if (container) {
                container.style.opacity = '1';
                container.style.pointerEvents = 'auto';
                
                // Remove overlay
                const overlay = container.querySelector('.disabled-overlay');
                if (overlay) {
                    overlay.remove();
                }
            }
            
            // Re-attach normal event listeners
            input.removeEventListener('change', handleAnswerSelection);
            input.removeEventListener('click', handleAnswerSelection);
            input.addEventListener('change', handleAnswerSelection);
            input.addEventListener('click', handleAnswerSelection);
        });
        log.info('✅ Answer inputs completely unblocked and re-enabled');
    }
    
    /**
     * Update hint message after hint is viewed
     */
    function updateHintMessageAfterViewing() {
        const hintMessage = document.getElementById('lilac-hint-message');
        if (hintMessage) {
            hintMessage.innerHTML = '<div style="display: flex; align-items: center; gap: 10px; color: #155724; font-weight: bold; font-size: 16px;"><span style="color: #28a745; font-size: 18px;">✓</span><span>רמז נצפה! כעת ניתן לבחור תשובה מחדש</span></div><button class="lilac-force-hint" style="background: #28a745; color: white; border: none; border-radius: 6px; padding: 10px 20px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background-color 0.3s; min-width: 80px;">רמז נוסף</button>';
            
            // Re-add click handler for additional hints
            const hintButton = hintMessage.querySelector('.lilac-force-hint');
            if (hintButton) {
                hintButton.addEventListener('click', () => {
                    showHintModal();
                    log.info('💡 Additional hint viewed');
                });
            }
        }
    }
    
    /**
     * Handle answer selection
     */
    function handleAnswerSelection(event) {
        const selectedInput = event.target;
        const selectedIndex = parseInt(selectedInput.value);
        
        log.info('🎯 Answer selected:', selectedIndex);
        log.info('🎯 Input element:', selectedInput);
        log.info('🎯 Input disabled:', selectedInput.disabled);
        log.info('🎯 Input data-blocked:', selectedInput.getAttribute('data-blocked'));
        log.info('🎯 Event type:', event.type);
        log.info('🎯 Current state - hintViewed:', state.hintViewed);
        
        // Find the question container and existing hint box
        const questionContainer = selectedInput.closest('.wpProQuiz_listItem');
        const existingHintBox = questionContainer?.querySelector('.lilac-hint-message');
        
        log.info('🎯 Question container found:', !!questionContainer);
        log.info('🎯 Existing hint box found:', !!existingHintBox);
        
        if (!existingHintBox) {
            log.info('⚠️ No hint box found to update');
            return;
        }
        
        // Add delay to ensure debugger data is current
        setTimeout(() => {
            // Check answer correctness
            let isCorrect = checkAnswerFromDebuggerData(selectedIndex);
            
            // Fallback to DOM checking if debugger data unavailable
            if (isCorrect === null) {
                isCorrect = checkAnswerFromDOM();
            }
            
            log.info('🎯 Answer correctness determined:', isCorrect);
            
            if (isCorrect === true) {
                log.info('✅ Correct answer detected - updating to success state');
                // Replace hint box content with success message
                existingHintBox.style.background = '#d4edda !important';
                existingHintBox.style.borderColor = '#28a745 !important';
                existingHintBox.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px; color: #155724; font-weight: bold; font-size: 16px; width: 100%;">
                        <span style="color: #28a745; font-size: 18px;">✅</span>
                        <span>כל הכבוד! תשובה נכונה</span>
                        <button class="lilac-next-question" style="
                            background: #28a745 !important;
                            color: white !important;
                            border: none !important;
                            border-radius: 6px !important;
                            padding: 10px 20px !important;
                            font-size: 16px !important;
                            font-weight: bold !important;
                            cursor: pointer !important;
                            margin-right: auto !important;
                        ">הבא</button>
                    </div>
                `;
                
                // Add click handler for next button
                const nextButton = existingHintBox.querySelector('.lilac-next-question');
                if (nextButton) {
                    nextButton.addEventListener('click', () => {
                        // Find and click the original quiz next button
                        const originalNext = document.querySelector('input[name="next"]');
                        if (originalNext) {
                            log.info('➡️ Clicking original next button');
                            originalNext.click();
                        } else {
                            // If no next button, look for end quiz button (last question)
                            const endButton = document.querySelector('input[name="endQuizSummary"]');
                            if (endButton) {
                                log.info('🏁 Clicking end quiz button (last question)');
                                endButton.click();
                            } else {
                                log.info('⚠️ No navigation button found');
                            }
                        }
                        
                        state.hintViewed = false;
                        state.canProceed = false;
                        log.info('➡️ State reset for next question');
                    });
                }
                
            } else if (isCorrect === false) {
                console.log('%c❌ WRONG ANSWER DETECTED - ACTIVATING NUCLEAR BLOCKING', 'color: red; font-size: 14px; font-weight: bold;');
                log.info('❌ Wrong answer detected - ACTIVATING AGGRESSIVE BLOCKING');
                
                // Add CSS class to the selected wrong answer for red highlighting
                const selectedAnswerItem = selectedInput.closest('.wpProQuiz_questionListItem');
                if (selectedAnswerItem) {
                    // Remove the class from all answers first
                    questionContainer.querySelectorAll('.wpProQuiz_questionListItem').forEach(item => {
                        item.classList.remove('selected-wrong-answer');
                    });
                    // Add class only to the selected wrong answer
                    selectedAnswerItem.classList.add('selected-wrong-answer');
                    log.info('🎨 Added selected-wrong-answer class to:', selectedAnswerItem);
                }
                
                // Activate aggressive JavaScript blocking
                AggressiveBlocker.activate();
                console.log('%c🔥 AGGRESSIVE BLOCKER ACTIVATED', 'color: red; font-size: 12px;');
                
                // Replace hint box content with error message
                existingHintBox.style.background = '#f8d7da !important';
                existingHintBox.style.borderColor = '#dc3545 !important';
                existingHintBox.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px; color: #721c24; font-weight: bold; font-size: 16px; width: 100%;">
                        <span style="color: #dc3545; font-size: 18px;">❌</span>
                        <span>תשובה שגויה! רמז לקבלת עזרה</span>
                        <button class="lilac-force-hint" style="
                            background: #dc3545 !important;
                            color: white !important;
                            border: none !important;
                            border-radius: 6px !important;
                            padding: 10px 20px !important;
                            font-size: 16px !important;
                            font-weight: bold !important;
                            cursor: pointer !important;
                            margin-right: auto !important;
                        ">רמז</button>
                    </div>
                `;
                
                // Add click handler for hint button
                const hintButton = existingHintBox.querySelector('.lilac-force-hint');
                if (hintButton) {
                    hintButton.addEventListener('click', () => {
                        showHintModal();
                        state.hintViewed = true;
                        log.info('💡 Hint viewed - modal opened');
                        
                        // Update hint message but keep aggressive blocking active
                        existingHintBox.style.background = '#fff3cd !important';
                        existingHintBox.style.borderColor = '#ffc107 !important';
                        existingHintBox.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 10px; color: #856404; font-weight: bold; font-size: 16px; width: 100%;">
                                <span style="color: #ffc107; font-size: 18px;">⏳</span>
                                <span>רמז פתוח - סגור את החלון כדי להמשיך</span>
                            </div>
                        `;
                        log.info('⏳ Waiting for modal to close before deactivating aggressive blocking');
                    });
                }
            } else {
                log.info('⚠️ Could not determine answer correctness');
            }
        }, 100);
    }
    
    /**
     * Setup question with hint enforcement
     */
    function setupQuestion(index, element) {
        const questionElement = element || document.querySelectorAll('.wpProQuiz_listItem')[index];
        if (!questionElement) return;
        
        log.info('🔧 Setting up question with hint enforcement');
        
        // Add event listeners to answer inputs
        const inputs = questionElement.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        inputs.forEach(input => {
            input.addEventListener('change', handleAnswerSelection);
            input.addEventListener('click', handleAnswerSelection);
        });
        
        // Show initial hint message
        showInlineHintMessage();
        
        log.info('✅ Quiz hint enforcement initialized');
    }
    
    /**
     * Disable answer inputs after wrong answer
     */
    function disableAnswerInputs() {
    const inputs = document.querySelectorAll('.wpProQuiz_questionListItem input[type="radio"], .wpProQuiz_questionListItem input[type="checkbox"]');
    inputs.forEach(input => {
        input.disabled = true;
        input.style.opacity = '0.5';
    });
    log.info('🚫 Answer inputs disabled');
    }
    
    /**
     * Enable answer inputs after hint viewing
     */
    function enableAnswerInputs() {
    const inputs = document.querySelectorAll('.wpProQuiz_questionListItem input[type="radio"], .wpProQuiz_questionListItem input[type="checkbox"]');
    inputs.forEach(input => {
        input.disabled = false;
        input.style.opacity = '1';
    });
    log.info('✅ Answer inputs re-enabled');
    }
    
    /**
     * Update hint message after hint is viewed
     */
    function updateHintMessageAfterViewing() {
    const hintMessage = document.getElementById('lilac-hint-message');
    if (hintMessage) {
        hintMessage.innerHTML = '<div style="display: flex; align-items: center; gap: 10px; color: #155724; font-weight: bold; font-size: 16px;"><span style="color: #28a745; font-size: 18px;">✓</span><span>רמז נצפה! כעת ניתן לבחור תשובה מחדש</span></div><button class="lilac-force-hint" style="background: #28a745; color: white; border: none; border-radius: 6px; padding: 10px 20px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background-color 0.3s; min-width: 80px;">רמז נוסף</button>';
        
        // Re-add click handler for additional hints
        const hintButton = hintMessage.querySelector('.lilac-force-hint');
        if (hintButton) {
            hintButton.addEventListener('click', () => {
                showHintModal();
                log.info('💡 Additional hint viewed');
            });
        }
        }
    }
    
    /**
     * Handle answer selection
     */
    function handleAnswerSelection(event) {
        const selectedInput = event.target;
        const selectedIndex = parseInt(selectedInput.value);
        
        log.info('🎯 Answer selected:', selectedIndex);
        
        // Find the question container and existing hint box
        const questionContainer = selectedInput.closest('.wpProQuiz_listItem');
        const existingHintBox = questionContainer?.querySelector('.lilac-hint-message');
        
        if (!existingHintBox) {
            log.info('⚠️ No hint box found to update');
            return;
        }
        
        // Add delay to ensure debugger data is current
        setTimeout(() => {
            // Check answer correctness
            let isCorrect = checkAnswerFromDebuggerData(selectedIndex);
            
            // Fallback to DOM checking if debugger data unavailable
            if (isCorrect === null) {
                isCorrect = checkAnswerFromDOM();
            }
            
            if (isCorrect === true) {
                log.info('✅ Correct answer detected');
                // Replace hint box content with success message
                existingHintBox.style.background = '#d4edda !important';
                existingHintBox.style.borderColor = '#28a745 !important';
                existingHintBox.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px; color: #155724; font-weight: bold; font-size: 16px; width: 100%;">
                        <span style="color: #28a745; font-size: 18px;">✅</span>
                        <span>כל הכבוד! תשובה נכונה</span>
                        <button class="lilac-next-question" style="
                            background: #28a745 !important;
                            color: white !important;
                            border: none !important;
                            border-radius: 6px !important;
                            padding: 10px 20px !important;
                            font-size: 16px !important;
                            font-weight: bold !important;
                            cursor: pointer !important;
                            margin-right: auto !important;
                        ">הבא</button>
                    </div>
                `;
                
                // Add click handler for next button
                const nextButton = existingHintBox.querySelector('.lilac-next-question');
                if (nextButton) {
                    nextButton.addEventListener('click', () => {
                        // Find and click the original quiz next button
                        const originalNext = document.querySelector('input[name="next"]');
                        if (originalNext) {
                            log.info('➡️ Clicking original next button');
                            originalNext.click();
                        } else {
                            // If no next button, look for end quiz button (last question)
                            const endButton = document.querySelector('input[name="endQuizSummary"]');
                            if (endButton) {
                                log.info('🏁 Clicking end quiz button (last question)');
                                endButton.click();
                            } else {
                                log.info('⚠️ No navigation button found');
                            }
                        }
                        
                        state.hintViewed = false;
                        state.canProceed = false;
                        log.info('➡️ State reset for next question');
                    });
                }
                
            } else if (isCorrect === false) {
                log.info('❌ Wrong answer detected');
                // Replace hint box content with error message
                existingHintBox.style.background = '#f8d7da !important';
                existingHintBox.style.borderColor = '#dc3545 !important';
                existingHintBox.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px; color: #721c24; font-weight: bold; font-size: 16px; width: 100%;">
                        <span style="color: #dc3545; font-size: 18px;">❌</span>
                        <span>תשובה שגויה! רמז לקבלת עזרה</span>
                        <button class="lilac-force-hint" style="
                            background: #dc3545 !important;
                            color: white !important;
                            border: none !important;
                            border-radius: 6px !important;
                            padding: 10px 20px !important;
                            font-size: 16px !important;
                            font-weight: bold !important;
                            cursor: pointer !important;
                            margin-right: auto !important;
                        ">רמז</button>
                    </div>
                `;
                
                // Add click handler for hint button
                const hintButton = existingHintBox.querySelector('.lilac-force-hint');
                if (hintButton) {
                    hintButton.addEventListener('click', () => {
                        showHintModal();
                        state.hintViewed = true;
                        log.info('💡 Hint viewed - modal opened');
                        
                        // Update hint message but keep inputs disabled until modal closes
                        existingHintBox.style.background = '#fff3cd !important';
                        existingHintBox.style.borderColor = '#ffc107 !important';
                        existingHintBox.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 10px; color: #856404; font-weight: bold; font-size: 16px; width: 100%;">
                                <span style="color: #ffc107; font-size: 18px;">⏳</span>
                                <span>רמז פתוח - סגור את החלון כדי להמשיך</span>
                            </div>
                        `;
                        log.info('⏳ Waiting for modal to close before enabling inputs');
                    });
                }
                
                disableAnswerInputs();
            } else {
                log.info('⚠️ Could not determine answer correctness');
            }
        }, 100);
    }
    
    /**
     * Setup question with hint enforcement
     */
    function setupQuestion(index, element) {
        const questionElement = element || document.querySelectorAll('.wpProQuiz_listItem')[index];
        if (!questionElement) return;
        
        log.info('🔧 Setting up question with hint enforcement');
        
        // Disable answer inputs initially
        const inputs = questionElement.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        inputs.forEach(input => {
            input.disabled = true;
            input.style.opacity = '0.5';
            input.addEventListener('change', handleAnswerSelection);
            input.addEventListener('click', handleAnswerSelection);
        });
        
        // Show initial hint message
        showInlineHintMessage();
        
        log.info('✅ Quiz hint enforcement initialized');
    }
    
    /**
     * Initialize hint enforcement when page loads
     */
    function initializeHintEnforcement() {
        log.info('🚀 Initializing hint enforcement system');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeHintEnforcement);
            return;
        }
        
        // Wait a bit more for quiz to fully load
        setTimeout(() => {
            const questions = document.querySelectorAll('.wpProQuiz_listItem');
            log.info('📋 Found questions:', questions.length);
            
            if (questions.length > 0) {
                questions.forEach((question, index) => {
                    setupQuestion(index, question);
                });
                
                // Also set up global event delegation for answer selection
                document.addEventListener('change', function(event) {
                    if (event.target.matches('.wpProQuiz_questionInput input[type="radio"], .wpProQuiz_questionInput input[type="checkbox"]')) {
                        log.info('🎯 Global answer selection detected');
                        handleAnswerSelection(event);
                    }
                });
                
                log.info('✅ Global event delegation set up');
            } else {
                log.info('⚠️ No questions found, retrying...');
                // Retry after a delay if no questions found
                setTimeout(() => {
                    const retryQuestions = document.querySelectorAll('.wpProQuiz_listItem');
                    log.info('📋 Retry found questions:', retryQuestions.length);
                    if (retryQuestions.length > 0) {
                        retryQuestions.forEach((question, index) => {
                            setupQuestion(index, question);
                        });
                        
                        // Set up global event delegation for retry case too
                        document.addEventListener('change', function(event) {
                            if (event.target.matches('.wpProQuiz_questionInput input[type="radio"], .wpProQuiz_questionInput input[type="checkbox"]')) {
                                log.info('🎯 Global answer selection detected (retry)');
                                handleAnswerSelection(event);
                            }
                        });
                        
                        log.info('✅ Global event delegation set up (retry)');
                    } else {
                        log.info('❌ Still no questions found after retry');
                    }
                }, 2000);
            }
        }, 500);
}

// Alternative initialization approach - use multiple methods
$(document).ready(function() {
    log.info('🚀 jQuery ready - starting hint enforcement');
    initializeHintEnforcement();
    
    // Set up universal event listener for answer changes - multiple selectors
    $(document).on('change click', 'input[type="radio"], input[type="checkbox"]', function(e) {
        log.info('🎯 Universal answer selection detected');
        handleAnswerSelection(e);
    });
    
    // Also try specific quiz selectors
    $(document).on('change click', '.wpProQuiz_questionInput input, .wpProQuiz_listItem input', function(e) {
        log.info('🎯 Quiz-specific answer selection detected');
        handleAnswerSelection(e);
    });
    
    log.info('✅ Universal event delegation set up');
    
    // Also try immediate initialization
    setTimeout(() => {
        log.info('🔄 Backup initialization attempt');
        const questions = document.querySelectorAll('.wpProQuiz_listItem');
        log.info('📋 Backup found questions:', questions.length);
        
        if (questions.length > 0) {
            questions.forEach((question, index) => {
                setupQuestion(index, question);
            });
        }
    }, 1000);
});

// Start initialization
initializeHintEnforcement();

})(jQuery);
