export default function PrivacyPolicyPage() {
  return (
    <div className="prose max-w-none">
      <h1 className="text-2xl font-semibold">Privacy Policy</h1>
      <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>

      <p>
        This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you use our
        application and website (collectively, the "Service"). It is designed to meet platform requirements for apps
        that integrate with third-party services such as Facebook, LinkedIn, TikTok, YouTube, WhatsApp, and Salla.
      </p>

      <h2 className="text-xl font-semibold">1. Information We Collect</h2>
      <ul className="list-disc pl-6">
        <li>
          <span className="font-medium">Account Information:</span> Name, email address, password hash, and plan/subscription
          details that you provide when you create or manage an account.
        </li>
        <li>
          <span className="font-medium">OAuth Tokens and IDs:</span> When you connect third-party accounts (e.g., Facebook
          Pages, LinkedIn Companies, TikTok, YouTube, WhatsApp, Salla), we receive access tokens, page/channel IDs, and
          similar identifiers strictly to provide the Service. We do not collect your third-party passwords.
        </li>
        <li>
          <span className="font-medium">Content and Metadata:</span> Posts, captions, media, scheduled times, analytics
          metrics, and other content you create or import to manage and publish via the Service.
        </li>
        <li>
          <span className="font-medium">Usage Data:</span> Device information, log data, and diagnostic information such as
          IP address, browser type, pages visited, and timestamps to improve the Service.
        </li>
      </ul>

      <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
      <ul className="list-disc pl-6">
        <li>Provide, operate, and maintain the Service features you request.</li>
        <li>Authenticate and securely connect your third-party accounts via OAuth.</li>
        <li>Create, schedule, publish, and analyze social and commerce content on your behalf.</li>
        <li>Monitor performance, debug issues, and enhance reliability and security.</li>
        <li>Communicate service updates, security alerts, and administrative messages.</li>
        <li>Comply with legal obligations and platform policies.</li>
      </ul>

      <h2 className="text-xl font-semibold">3. Facebook and Other Platform Data</h2>
      <p>
        When you connect Facebook products (e.g., Facebook Pages, Instagram accounts via Facebook, or WhatsApp Business),
        we use data only to provide the features you enable, such as scheduling posts, reading page insights, or managing
        conversations. We do not sell your data. We do not use Facebook data to build profiles of users for advertising
        outside the Service. We store tokens securely and respect the permissions you grant. If you remove permissions
        or disconnect an account, our access will cease accordingly.
      </p>

      <h2 className="text-xl font-semibold">4. Data Sharing and Disclosure</h2>
      <ul className="list-disc pl-6">
        <li>
          <span className="font-medium">Service Providers:</span> We may share limited data with vendors who help us operate
          the Service (e.g., hosting, analytics, error monitoring) under confidentiality and data processing agreements.
        </li>
        <li>
          <span className="font-medium">Platform APIs:</span> We disclose data to connected platforms (e.g., Facebook Graph API,
          LinkedIn, TikTok, YouTube, WhatsApp, Salla) strictly as necessary to perform actions you request.
        </li>
        <li>
          <span className="font-medium">Legal Requirements:</span> We may disclose information if required by law, regulation, or
          valid legal process.
        </li>
        <li>
          <span className="font-medium">Business Transfers:</span> In the event of a merger, acquisition, or asset sale, your
          information may be transferred as permitted by law.
        </li>
      </ul>

      <h2 className="text-xl font-semibold">5. Data Retention</h2>
      <p>
        We retain personal data for as long as your account is active or as needed to provide the Service. We may retain
        and use information as necessary to comply with legal obligations, resolve disputes, and enforce our agreements.
        Access tokens are stored only while required to maintain your connections and are revoked or deleted upon
        disconnection or account deletion.
      </p>

      <h2 className="text-xl font-semibold">6. Your Rights and Choices</h2>
      <ul className="list-disc pl-6">
        <li>Access, correct, or delete certain personal information in your account settings.</li>
        <li>Disconnect any linked third-party account at any time.</li>
        <li>Opt out of non-essential communications by using unsubscribe links where available.</li>
        <li>Request a copy or deletion of your data by contacting us at the email below.</li>
      </ul>

      <h2 className="text-xl font-semibold">7. Security</h2>
      <p>
        We implement administrative, technical, and physical safeguards designed to protect personal information. No
        method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute
        security.
      </p>

      <h2 className="text-xl font-semibold">8. Children’s Privacy</h2>
      <p>
        The Service is not directed to individuals under the age of 13 (or the equivalent age of consent in your
        jurisdiction). We do not knowingly collect personal information from children.
      </p>

      <h2 className="text-xl font-semibold">9. International Data Transfers</h2>
      <p>
        If you access the Service from outside your country, your information may be transferred to, stored, and
        processed in countries where we or our service providers operate. We take measures to ensure appropriate
        safeguards are in place.
      </p>

      <h2 className="text-xl font-semibold">10. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy to reflect changes to our practices, technologies, or legal requirements. If we
        make material changes, we will notify you by posting the new policy on this page and updating the "Last updated"
        date above.
      </p>

      <h2 className="text-xl font-semibold">11. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy or our data practices, please contact us at:
      </p>
      <p className="whitespace-pre-line">
        Email: abdelhady412@gmail.com
       
      </p>
    </div>
  );
}



