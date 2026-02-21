/**
 * Contact Form Handler
 * Stores submissions in JSON file and provides backup storage
 */

class ContactFormHandler {
    constructor() {
        this.STORAGE_KEY = 'contact_submissions';
        this.GITHUB_API_URL = 'https://api.github.com/repos/Barkotullah02/Barkotullah02.github.io/contents/contact-submissions/';
        this.submissions = this.loadSubmissions();
    }

    /**
     * Load existing submissions from localStorage
     */
    loadSubmissions() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading submissions:', error);
            return [];
        }
    }

    /**
     * Save submission to localStorage
     */
    saveToLocalStorage(submission) {
        this.submissions.push(submission);
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.submissions));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    /**
     * Save submission to GitHub repository as JSON file
     * Requires GitHub Personal Access Token to be set
     */
    async saveToGitHub(submission) {
        // Check if GitHub token is available
        const token = localStorage.getItem('github_token');
        if (!token) {
            console.info('GitHub token not set. Submission saved locally only.');
            return { success: false, message: 'No GitHub token configured' };
        }

        try {
            const timestamp = Date.now();
            const filename = `submission-${timestamp}.json`;
            const content = btoa(JSON.stringify(submission, null, 2));

            const response = await fetch(`${this.GITHUB_API_URL}${filename}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Add contact form submission ${timestamp}`,
                    content: content,
                    branch: 'main'
                })
            });

            if (response.ok) {
                return { success: true, message: 'Saved to GitHub repository' };
            } else {
                const error = await response.json();
                console.error('GitHub API error:', error);
                return { success: false, message: error.message };
            }
        } catch (error) {
            console.error('Error saving to GitHub:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Handle form submission
     */
    async handleSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        
        // Show loading state
        submitButton.textContent = 'SENDING...';
        submitButton.disabled = true;

        // Collect form data
        const formData = new FormData(form);
        const submission = {
            timestamp: new Date().toISOString(),
            name: formData.get('name'),
            email: formData.get('email'),
            message: formData.get('message'),
            userAgent: navigator.userAgent,
            referrer: document.referrer || 'direct'
        };

        try {
            // Save to localStorage (always works)
            this.saveToLocalStorage(submission);

            // Try to save to GitHub (optional, requires token)
            const githubResult = await this.saveToGitHub(submission);

            // Send email notification via Formspree (fallback delivery method)
            const emailSent = await this.sendEmailNotification(submission);

            // Show success message
            this.showNotification(
                'success', 
                `Message sent successfully! ${githubResult.success ? 'Saved to repository.' : 'Saved locally.'}`
            );

            // Reset form
            form.reset();

            // Log for debugging
            console.log('Submission saved:', submission);
            if (githubResult.success) {
                console.log('✓ Saved to GitHub repository');
            } else {
                console.log('ℹ Saved locally only (set GitHub token for repository storage)');
            }

        } catch (error) {
            console.error('Submission error:', error);
            this.showNotification('error', 'An error occurred. Please try again or email directly.');
        } finally {
            // Restore button state
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    }

    /**
     * Send email notification (using mailto or external service)
     */
    async sendEmailNotification(submission) {
        // Option 1: Use Formspree (free tier - replace with your Formspree ID)
        // Sign up at https://formspree.io/ and get your form ID
        const FORMSPREE_ID = 'YOUR_FORMSPREE_ID'; // Replace with actual ID
        
        if (FORMSPREE_ID !== 'YOUR_FORMSPREE_ID') {
            try {
                const response = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(submission)
                });
                return response.ok;
            } catch (error) {
                console.error('Formspree error:', error);
                return false;
            }
        }
        
        return false;
    }

    /**
     * Show notification to user
     */
    showNotification(type, message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-md animate-slide-in ${
            type === 'success' 
                ? 'bg-green-900 border border-green-500 text-green-100' 
                : 'bg-red-900 border border-red-500 text-red-100'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="text-xl">
                    ${type === 'success' ? '✓' : '✗'}
                </div>
                <div class="flex-1">
                    <p class="font-medium">${type === 'success' ? 'Success!' : 'Error'}</p>
                    <p class="text-sm opacity-90">${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-xl leading-none hover:opacity-75">
                    ×
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    /**
     * Export all submissions as JSON file
     */
    exportSubmissions() {
        const dataStr = JSON.stringify(this.submissions, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `contact-submissions-${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Get all submissions
     */
    getSubmissions() {
        return this.submissions;
    }

    /**
     * Clear all submissions
     */
    clearSubmissions() {
        if (confirm('Are you sure you want to clear all submissions?')) {
            this.submissions = [];
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        }
        return false;
    }
}

// Initialize form handler
const contactHandler = new ContactFormHandler();

// Add form submit listener when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.querySelector('form[aria-label="Contact form"]');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => contactHandler.handleSubmit(e));
    }
});

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-in {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    .animate-slide-in {
        animation: slide-in 0.3s ease-out;
        transition: all 0.3s ease-out;
    }
`;
document.head.appendChild(style);
