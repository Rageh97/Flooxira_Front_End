export default function TermsOfServicePage() {
  return (
    <div className="prose max-w-none">
      <h1 className="text-2xl font-semibold">Terms of Service</h1>
      <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>

      <p>
        These Terms of Service ("Terms") govern your access to and use of our application and website (the "Service").
        By creating an account or using the Service, you agree to be bound by these Terms.
      </p>

      <h2 className="text-xl font-semibold">1. Use of the Service</h2>
      <ul className="list-disc pl-6">
        <li>You must be at least 18 years old and capable of entering into a contract.</li>
        <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
        <li>You will comply with applicable laws and third-party platform policies (e.g., Facebook, LinkedIn, TikTok, YouTube, WhatsApp, Salla).</li>
        <li>You will not misuse the Service, interfere with its operation, or attempt unauthorized access.</li>
      </ul>

      <h2 className="text-xl font-semibold">2. Third-Party Platforms</h2>
      <p>
        The Service integrates with third-party platforms and APIs. Your use of those platforms is governed by their
        respective terms and policies. You authorize us to act on your behalf within the permissions you grant to create,
        schedule, publish, retrieve analytics, or manage conversations where applicable.
      </p>

      <h2 className="text-xl font-semibold">3. Content and Licenses</h2>
      <ul className="list-disc pl-6">
        <li>You retain ownership of the content you create or upload to the Service.</li>
        <li>You grant us a limited, non-exclusive license to process your content solely to operate the Service.</li>
        <li>You represent that you have all necessary rights to the content you submit and that it does not infringe the rights of others.</li>
      </ul>

      <h2 className="text-xl font-semibold">4. Plans, Billing, and Refunds</h2>
      <p>
        Certain features may require a paid plan. Fees, billing cycles, and renewal terms will be presented at checkout.
        Unless required by law, payments are non-refundable. You may cancel at any time; access continues until the end of
        the current billing period.
      </p>

      <h2 className="text-xl font-semibold">5. Acceptable Use</h2>
      <ul className="list-disc pl-6">
        <li>No unlawful, misleading, discriminatory, or fraudulent activity.</li>
        <li>No harassment or abuse of other users or third parties.</li>
        <li>No spam, platform policy violations, or circumvention of rate limits or API restrictions.</li>
      </ul>

      <h2 className="text-xl font-semibold">6. Privacy</h2>
      <p>
        Our <a href="/privacy-policy" className="underline">Privacy Policy</a> explains how we collect and use personal data. By using the
        Service, you agree to our data practices described there.
      </p>

      <h2 className="text-xl font-semibold">7. Intellectual Property</h2>
      <p>
        The Service, including its software, design, and trademarks, is owned by us or our licensors and protected by
        intellectual property laws. These Terms do not grant you any rights to our brands or software beyond what is
        necessary to use the Service as intended.
      </p>

      <h2 className="text-xl font-semibold">8. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
        WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT
        GUARANTEE UNINTERRUPTED OR ERROR-FREE OPERATION.
      </p>

      <h2 className="text-xl font-semibold">9. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL WE BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL,
        CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY,
        OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.
      </p>

      <h2 className="text-xl font-semibold">10. Suspension and Termination</h2>
      <p>
        We may suspend or terminate your access to the Service if you violate these Terms, create risk or legal exposure
        for us, or if we stop providing the Service. You may stop using the Service at any time.
      </p>

      <h2 className="text-xl font-semibold">11. Changes to the Terms</h2>
      <p>
        We may update these Terms from time to time. If we make material changes, we will notify you by posting the
        updated Terms and updating the "Last updated" date above. Your continued use constitutes acceptance.
      </p>

      <h2 className="text-xl font-semibold">12. Governing Law</h2>
      <p>
        These Terms are governed by the laws of your jurisdiction of incorporation/operation, without regard to conflict
        of law principles. Venue for disputes will be in the competent courts of that jurisdiction.
      </p>

      <h2 className="text-xl font-semibold">13. Contact</h2>
      <p>
        Questions about these Terms can be sent to: support@example.com
      </p>
    </div>
  );
}



