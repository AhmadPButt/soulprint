import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TermsDialogProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

const TermsDialog = ({ open, onAccept, onCancel }: TermsDialogProps) => {
  const [agreed, setAgreed] = useState(false);

  const handleAccept = () => {
    if (agreed) {
      onAccept();
      setAgreed(false); // Reset for next time
    }
  };

  const handleCancel = () => {
    setAgreed(false);
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/30">
          <DialogTitle className="text-2xl font-heading">Terms & Conditions and Privacy Policy</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="terms" className="flex-1 flex flex-col">
          <TabsList className="mx-6 mt-2 grid w-auto grid-cols-2">
            <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
          </TabsList>

          <TabsContent value="terms" className="flex-1 mt-0">
            <ScrollArea className="h-[calc(80vh-240px)] px-6">
              <div className="prose prose-invert max-w-none py-4">
                <h1 className="text-xl font-bold mb-4">TERMS AND CONDITIONS</h1>
                <h2 className="text-lg font-semibold mb-3">Erranza SoulPrint Assessment Application</h2>
                <p className="text-sm text-muted-foreground mb-4">Last Updated: November 2025</p>
                
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6">
                  <p className="text-sm font-semibold">IMPORTANT: Please read these Terms and Conditions carefully before using the SoulPrint application. By completing the SoulPrint questionnaire, you agree to be bound by these terms. If you do not agree, please do not use the Application.</p>
                </div>

                <h3 className="text-base font-semibold mt-6 mb-3">1. Definitions and Interpretation</h3>
                <h4 className="text-sm font-semibold mt-4 mb-2">1.1 Definitions</h4>
                <p className="text-sm mb-2">In these Terms and Conditions:</p>
                <ul className="text-sm space-y-2 mb-4">
                  <li>"Application" or "SoulPrint" means the Erranza SoulPrint psychological assessment tool, including all associated software, content, and services.</li>
                  <li>"Company", "we", "us", or "our" means ERRANZA LTD, a company registered in England and Wales (Company Number: 16505564).</li>
                  <li>"Expedition" means any travel experience organised by Erranza, including but not limited to the Azerbaijan expedition programme.</li>
                  <li>"SoulPrint Profile" means the psychological profile, scores, insights, and narratives generated from your questionnaire responses.</li>
                  <li>"User", "you", or "your" means any individual who accesses or uses the Application.</li>
                </ul>

                <h4 className="text-sm font-semibold mt-4 mb-2">1.2 Interpretation</h4>
                <p className="text-sm mb-4">References to statutes include any amendments, re-enactments, or replacements. Headings are for convenience only and do not affect interpretation.</p>

                <h3 className="text-base font-semibold mt-6 mb-3">2. Acceptance of Terms</h3>
                <h4 className="text-sm font-semibold mt-4 mb-2">2.1 By accessing or using SoulPrint, you confirm that:</h4>
                <ul className="text-sm space-y-2 mb-4">
                  <li>(a) You have read, understood, and agree to these Terms and Conditions;</li>
                  <li>(b) You are at least 18 years of age;</li>
                  <li>(c) You have the legal capacity to enter into a binding agreement;</li>
                  <li>(d) You consent to the collection and processing of your personal data as described in our Privacy Policy.</li>
                </ul>

                <p className="text-sm mb-4">2.2 If you are completing SoulPrint on behalf of another person, you confirm that you have their authorisation to do so and that they have consented to these Terms.</p>

                <h3 className="text-base font-semibold mt-6 mb-3">3. Application Description and Purpose</h3>
                <p className="text-sm mb-2">3.1 SoulPrint is a proprietary psychological assessment tool that measures personality traits, travel preferences, emotional states, and inner motivations to create personalised travel experiences.</p>
                <p className="text-sm mb-2">3.2 The Application collects your responses to 55 questions across eight thematic sections, including sliders, multiple choice questions, rankings, and open-text responses.</p>
                <p className="text-sm mb-2">3.3 Your responses are processed using validated psychometric formulas and artificial intelligence to generate:</p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• Numerical scores for personality traits and travel behaviours</li>
                  <li>• Business intelligence metrics for expedition planning</li>
                  <li>• AI-generated narrative insights about your traveller profile</li>
                  <li>• Recommendations for personalised journey experiences</li>
                </ul>
                <p className="text-sm mb-4">3.4 SoulPrint is designed exclusively to support Erranza's expedition planning services. It is not a clinical psychological assessment and should not be used for diagnostic, therapeutic, or medical purposes.</p>

                <h3 className="text-base font-semibold mt-6 mb-3">4. Eligibility and Access</h3>
                <p className="text-sm mb-2">4.1 SoulPrint is available only to individuals who:</p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>(a) Are 18 years of age or older;</li>
                  <li>(b) Are considering or have booked an Erranza expedition;</li>
                  <li>(c) Have the mental capacity to understand and respond to the questionnaire honestly.</li>
                </ul>
                <p className="text-sm mb-2">4.2 We reserve the right to refuse access to any individual at our sole discretion.</p>
                <p className="text-sm mb-4">4.3 You must complete the questionnaire yourself. Submitting responses on behalf of another person without their knowledge and consent is prohibited.</p>

                <h3 className="text-base font-semibold mt-6 mb-3">5. User Obligations</h3>
                <p className="text-sm mb-2">5.1 When using SoulPrint, you agree to:</p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>(a) Provide accurate, truthful, and complete responses to all questions;</li>
                  <li>(b) Not attempt to manipulate or game the assessment;</li>
                  <li>(c) Not share your SoulPrint Profile with third parties in a way that misrepresents Erranza;</li>
                  <li>(d) Not reverse-engineer, copy, or reproduce the Application or its methodology;</li>
                  <li>(e) Not use automated tools, bots, or scripts to interact with the Application;</li>
                  <li>(f) Not attempt to access other users' data or profiles;</li>
                  <li>(g) Comply with all applicable laws and regulations.</li>
                </ul>
                <p className="text-sm mb-4">5.2 Failure to comply with these obligations may result in termination of your access to the Application and any associated Erranza services.</p>

                <h3 className="text-base font-semibold mt-6 mb-3">6. Intellectual Property Rights</h3>
                <p className="text-sm mb-2">6.1 All intellectual property rights in the Application, including but not limited to:</p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• The SoulPrint name, branding, and trademarks</li>
                  <li>• The questionnaire design, questions, and methodology</li>
                  <li>• Psychometric formulas and scoring algorithms</li>
                  <li>• AI-generated narratives and insights</li>
                  <li>• Software code, databases, and user interfaces</li>
                </ul>
                <p className="text-sm mb-4">are owned by or licensed to Erranza Ltd. You may not use, reproduce, modify, or distribute any part of the Application without our express written permission.</p>

                <h3 className="text-base font-semibold mt-6 mb-3">7. Data Protection and Privacy</h3>
                <p className="text-sm mb-2">7.1 We take your privacy seriously. Our Privacy Policy explains how we collect, use, store, and protect your personal data.</p>
                <p className="text-sm mb-2">7.2 By using SoulPrint, you consent to:</p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• The collection of your questionnaire responses and personal information</li>
                  <li>• The processing of your data using AI and psychometric algorithms</li>
                  <li>• The storage of your SoulPrint Profile on our secure servers</li>
                  <li>• The use of your data to improve our services (anonymised where possible)</li>
                </ul>

                <h3 className="text-base font-semibold mt-6 mb-3">8. Disclaimers</h3>
                <p className="text-sm mb-2">8.1 SoulPrint is provided "as is" without warranties of any kind, either express or implied.</p>
                <p className="text-sm mb-2">8.2 We do not warrant that:</p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• The Application will be uninterrupted, error-free, or secure</li>
                  <li>• Your SoulPrint Profile will be completely accurate</li>
                  <li>• Expedition experiences will exactly match your profile recommendations</li>
                </ul>
                <p className="text-sm mb-4">8.3 SoulPrint is not a substitute for professional psychological, psychiatric, or medical advice. If you are experiencing mental health difficulties, please consult a qualified healthcare professional.</p>

                <h3 className="text-base font-semibold mt-6 mb-3">9. Limitation of Liability</h3>
                <p className="text-sm mb-2">9.1 To the fullest extent permitted by law, Erranza Ltd shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of SoulPrint.</p>
                <p className="text-sm mb-4">9.2 Our total liability to you for all claims arising from or related to the Application shall not exceed £100.</p>

                <h3 className="text-base font-semibold mt-6 mb-3">10. Changes to Terms</h3>
                <p className="text-sm mb-4">We may update these Terms and Conditions from time to time. Continued use of the Application after changes constitutes acceptance of the updated terms.</p>

                <h3 className="text-base font-semibold mt-6 mb-3">11. Governing Law</h3>
                <p className="text-sm mb-4">These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>

                <h3 className="text-base font-semibold mt-6 mb-3">12. Contact Information</h3>
                <p className="text-sm mb-1">ERRANZA LTD</p>
                <p className="text-sm mb-1">Sister - Renold Building, 32a Altrincham Street</p>
                <p className="text-sm mb-1">Manchester, England, M1 7JR</p>
                <p className="text-sm mb-1">Company Number: 16505564</p>
                <p className="text-sm mb-6">Email: ahmad@erranza.ai</p>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="privacy" className="flex-1 mt-0">
            <ScrollArea className="h-[calc(80vh-240px)] px-6">
              <div className="prose prose-invert max-w-none py-4">
                <h1 className="text-xl font-bold mb-4">PRIVACY POLICY</h1>
                <h2 className="text-lg font-semibold mb-3">Erranza SoulPrint Assessment Application</h2>
                <p className="text-sm text-muted-foreground mb-4">Last Updated: November 2025</p>

                <h3 className="text-base font-semibold mt-6 mb-3">1. Introduction</h3>
                <p className="text-sm mb-2">Erranza Ltd ("Erranza", "we", "us", or "our") is committed to protecting your privacy and ensuring the security of your personal data. This Privacy Policy explains how we collect, use, store, and protect your information when you use our SoulPrint psychological assessment application ("SoulPrint" or the "Application").</p>
                <p className="text-sm mb-2">SoulPrint is a proprietary psychological profiling tool designed to create personalised travel experiences for our Azerbaijan expedition programmes. By completing the SoulPrint questionnaire, you help us understand your personality traits, travel preferences, and emotional needs so we can craft a journey tailored specifically to you.</p>
                <p className="text-sm mb-4">This Privacy Policy is designed to comply with the UK General Data Protection Regulation (UK GDPR), the EU General Data Protection Regulation (EU GDPR), and other applicable data protection laws.</p>

                <h3 className="text-base font-semibold mt-6 mb-3">2. Data Controller</h3>
                <p className="text-sm mb-1">The data controller responsible for your personal data is:</p>
                <p className="text-sm mb-1 font-semibold">ERRANZA LTD</p>
                <p className="text-sm mb-1">Sister - Renold Building, 32a Altrincham Street</p>
                <p className="text-sm mb-1">Manchester, England, M1 7JR</p>
                <p className="text-sm mb-1">United Kingdom</p>
                <p className="text-sm mb-1">Company Registration Number: 16505564</p>
                <p className="text-sm mb-4">Email: ahmad@erranza.ai</p>
                <p className="text-sm mb-4">If you have any questions about this Privacy Policy or our data practices, please contact us at ahmad@erranza.ai.</p>

                <h3 className="text-base font-semibold mt-6 mb-3">3. Data We Collect</h3>
                <p className="text-sm mb-2">When you complete the SoulPrint questionnaire, we collect the following categories of personal data:</p>

                <h4 className="text-sm font-semibold mt-4 mb-2">3.1 Identity Data</h4>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• Full name</li>
                  <li>• Email address</li>
                  <li>• Country of residence</li>
                  <li>• Passport nationality</li>
                </ul>

                <h4 className="text-sm font-semibold mt-4 mb-2">3.2 Psychological Profile Data</h4>
                <p className="text-sm mb-2">SoulPrint measures psychological constructs using validated psychometric scales. This includes:</p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• Personality traits (Big Five model): Extraversion, Openness, Conscientiousness, Agreeableness, Emotional Stability</li>
                  <li>• Travel behaviour preferences: Spontaneity, Adventure Orientation, Environmental Adaptation</li>
                  <li>• Elemental landscape resonance preferences</li>
                  <li>• Inner motivations: Transformation, Clarity, Aliveness, Connection</li>
                  <li>• Current emotional state and burden indicators</li>
                </ul>

                <h4 className="text-sm font-semibold mt-4 mb-2">3.3 Narrative Data</h4>
                <p className="text-sm mb-2">Free-text responses you provide describing:</p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• Your reasons for choosing Azerbaijan</li>
                  <li>• What you hope to gain from the journey</li>
                </ul>

                <h4 className="text-sm font-semibold mt-4 mb-2">3.4 Practical Travel Data</h4>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• Travel companion preferences (solo, partner, friend, group)</li>
                  <li>• Room type preferences</li>
                  <li>• Dietary requirements and restrictions</li>
                </ul>

                <h4 className="text-sm font-semibold mt-4 mb-2">3.5 Technical Data</h4>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• IP address (anonymised after 30 days)</li>
                  <li>• Browser type and version</li>
                  <li>• Device information</li>
                  <li>• Submission timestamp</li>
                </ul>

                <h3 className="text-base font-semibold mt-6 mb-3">4. Special Category Data</h3>
                <p className="text-sm mb-2">Some information collected through SoulPrint may constitute "special category data" under GDPR, including:</p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• Psychological and mental health indicators (emotional burden, life phase assessments)</li>
                  <li>• Data revealing aspects of your psychological profile</li>
                </ul>
                <p className="text-sm mb-4">We process this data only with your explicit consent, which you provide by completing and submitting the SoulPrint questionnaire. You may withdraw this consent at any time (see Section 10).</p>

                <h3 className="text-base font-semibold mt-6 mb-3">5. Legal Basis for Processing</h3>
                <p className="text-sm mb-2">We process your personal data on the following legal bases:</p>
                <ul className="text-sm space-y-2 mb-4">
                  <li><span className="font-semibold">Consent (Article 6(1)(a) and Article 9(2)(a) GDPR)</span> - Your explicit consent when you complete and submit the SoulPrint questionnaire. This is particularly important for special category data relating to your psychological profile.</li>
                  <li><span className="font-semibold">Contract Performance (Article 6(1)(b) GDPR)</span> - Processing necessary to provide you with our personalised travel services, including expedition planning and group matching.</li>
                  <li><span className="font-semibold">Legitimate Interests (Article 6(1)(f) GDPR)</span> - Processing for our legitimate business interests, including service improvement, internal analytics, and fraud prevention, where these interests are not overridden by your rights.</li>
                </ul>

                <h3 className="text-base font-semibold mt-6 mb-3">6. How We Use Your Data</h3>
                <p className="text-sm mb-2">We use your SoulPrint data for the following purposes:</p>

                <h4 className="text-sm font-semibold mt-4 mb-2">6.1 Primary Purposes</h4>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• Creating your personalised SoulPrint Profile</li>
                  <li>• Designing bespoke Azerbaijan expedition experiences tailored to your personality and preferences</li>
                  <li>• Matching you with compatible travel companions and group dynamics</li>
                  <li>• Providing recommendations for activities, locations, and experiences</li>
                </ul>

                <h4 className="text-sm font-semibold mt-4 mb-2">6.2 Secondary Purposes</h4>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• Service improvement and product development</li>
                  <li>• Internal analytics and business intelligence (using anonymised data)</li>
                  <li>• Communication regarding your expedition and related services</li>
                  <li>• Compliance with legal obligations</li>
                </ul>

                <h3 className="text-base font-semibold mt-6 mb-3">7. Data Sharing and Disclosure</h3>
                <p className="text-sm mb-2">We do not sell your personal data to third parties. However, we may share your data in the following limited circumstances:</p>

                <h4 className="text-sm font-semibold mt-4 mb-2">7.1 Service Providers</h4>
                <p className="text-sm mb-2">We may share data with trusted third-party service providers who assist us in:</p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• Cloud hosting and data storage (e.g., Supabase, AWS)</li>
                  <li>• AI processing for narrative generation (e.g., OpenAI API)</li>
                  <li>• Email communications</li>
                  <li>• Analytics and monitoring</li>
                </ul>
                <p className="text-sm mb-4">All service providers are contractually bound to process your data only as instructed and to maintain appropriate security measures.</p>

                <h4 className="text-sm font-semibold mt-4 mb-2">7.2 Legal Obligations</h4>
                <p className="text-sm mb-4">We may disclose your data if required by law, court order, or governmental authority, or to protect our legal rights.</p>

                <h4 className="text-sm font-semibold mt-4 mb-2">7.3 Business Transfers</h4>
                <p className="text-sm mb-4">In the event of a merger, acquisition, or sale of assets, your data may be transferred to the acquiring entity, subject to the same privacy protections.</p>

                <h3 className="text-base font-semibold mt-6 mb-3">8. Data Security</h3>
                <p className="text-sm mb-2">We implement industry-standard security measures to protect your data, including:</p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• Encryption of data in transit (HTTPS/TLS) and at rest</li>
                  <li>• Access controls and authentication mechanisms</li>
                  <li>• Regular security audits and vulnerability assessments</li>
                  <li>• Secure cloud infrastructure with backup and disaster recovery</li>
                  <li>• Staff training on data protection and confidentiality</li>
                </ul>
                <p className="text-sm mb-4">While we strive to protect your data, no system is completely secure. You acknowledge that you provide your data at your own risk.</p>

                <h3 className="text-base font-semibold mt-6 mb-3">9. Data Retention</h3>
                <p className="text-sm mb-2">We retain your SoulPrint data for the following periods:</p>
                <ul className="text-sm space-y-2 mb-4">
                  <li><span className="font-semibold">Active expedition planning:</span> For the duration of your engagement with Erranza and up to 2 years following your expedition</li>
                  <li><span className="font-semibold">Anonymised analytics:</span> Indefinitely, as anonymised data cannot be linked back to you</li>
                  <li><span className="font-semibold">Legal requirements:</span> As required by applicable laws (e.g., financial records for tax purposes)</li>
                </ul>
                <p className="text-sm mb-4">After the retention period expires, we will securely delete or anonymise your personal data.</p>

                <h3 className="text-base font-semibold mt-6 mb-3">10. Your Rights</h3>
                <p className="text-sm mb-2">Under GDPR, you have the following rights regarding your personal data:</p>
                <ul className="text-sm space-y-2 mb-4">
                  <li><span className="font-semibold">Right of Access:</span> Request a copy of your SoulPrint data</li>
                  <li><span className="font-semibold">Right to Rectification:</span> Correct inaccurate or incomplete data</li>
                  <li><span className="font-semibold">Right to Erasure:</span> Request deletion of your data (subject to legal obligations)</li>
                  <li><span className="font-semibold">Right to Restrict Processing:</span> Limit how we use your data</li>
                  <li><span className="font-semibold">Right to Data Portability:</span> Receive your data in a structured, machine-readable format</li>
                  <li><span className="font-semibold">Right to Object:</span> Object to processing based on legitimate interests</li>
                  <li><span className="font-semibold">Right to Withdraw Consent:</span> Withdraw your consent at any time</li>
                </ul>
                <p className="text-sm mb-4">To exercise any of these rights, please contact us at ahmad@erranza.ai. We will respond within 30 days.</p>

                <h3 className="text-base font-semibold mt-6 mb-3">11. International Data Transfers</h3>
                <p className="text-sm mb-4">Your data may be transferred to and stored in countries outside the UK and EEA. Where this occurs, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses or adequacy decisions by the UK or EU authorities.</p>

                <h3 className="text-base font-semibold mt-6 mb-3">12. Children's Privacy</h3>
                <p className="text-sm mb-4">SoulPrint is not intended for individuals under 18 years of age. We do not knowingly collect data from children. If we become aware that we have collected data from a child, we will delete it promptly.</p>

                <h3 className="text-base font-semibold mt-6 mb-3">13. Changes to This Privacy Policy</h3>
                <p className="text-sm mb-4">We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. The "Last Updated" date at the top indicates when the policy was last revised. Continued use of SoulPrint after changes constitutes acceptance of the updated policy.</p>

                <h3 className="text-base font-semibold mt-6 mb-3">14. Complaints</h3>
                <p className="text-sm mb-2">If you are unhappy with how we have handled your data, you have the right to lodge a complaint with the relevant supervisory authority:</p>
                <ul className="text-sm space-y-1 mb-4">
                  <li><span className="font-semibold">UK:</span> Information Commissioner's Office (ICO) - ico.org.uk</li>
                  <li><span className="font-semibold">EU:</span> Your national data protection authority</li>
                </ul>

                <h3 className="text-base font-semibold mt-6 mb-3">15. Contact Us</h3>
                <p className="text-sm mb-1">If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
                <p className="text-sm mb-1 font-semibold mt-4">ERRANZA LTD</p>
                <p className="text-sm mb-1">Sister - Renold Building, 32a Altrincham Street</p>
                <p className="text-sm mb-1">Manchester, England, M1 7JR</p>
                <p className="text-sm mb-1">Email: ahmad@erranza.ai</p>
                <p className="text-sm mb-6">We are committed to resolving any privacy concerns promptly and transparently.</p>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="px-6 pb-6 pt-4 border-t border-border/30 flex-col sm:flex-row gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              id="terms-agreement"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
              className="mt-1"
            />
            <Label
              htmlFor="terms-agreement"
              className="text-sm font-normal cursor-pointer leading-relaxed"
            >
              I have read, understood, and agree to the Terms & Conditions and Privacy Policy. I confirm that I am at least 18 years of age and consent to the collection and processing of my personal data as described above.
            </Label>
          </div>
          <div className="flex gap-2 sm:ml-auto">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!agreed}
              className="bg-lavender-accent hover:bg-lavender-accent/90 text-white"
            >
              Accept & Continue
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsDialog;
