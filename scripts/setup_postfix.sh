#!/bin/bash

DOMAIN="usaaffiliatemarketing.com"
SELECTOR="mail"

echo "Configuring Postfix..."
postconf -e "myhostname = $DOMAIN"
postconf -e "myorigin = /etc/mailname"
echo "$DOMAIN" > /etc/mailname
postconf -e "mydestination = $DOMAIN, localhost.localdomain, localhost"
postconf -e "mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128 172.17.0.0/16 172.18.0.0/16"
postconf -e "inet_interfaces = all"

echo "Configuring OpenDKIM..."
mkdir -p /etc/opendkim/keys/$DOMAIN
cd /etc/opendkim/keys/$DOMAIN
opendkim-genkey -s $SELECTOR -d $DOMAIN
chown opendkim:opendkim $SELECTOR.private
chown opendkim:opendkim $SELECTOR.txt

cat <<EOF > /etc/opendkim.conf
AutoRestart             Yes
AutoRestartRate         10/1h
UMask                   002
Syslog                  yes
SyslogSuccess           Yes
LogWhy                  Yes
Canonicalization        relaxed/simple
ExternalIgnoreList      refile:/etc/opendkim/TrustedHosts
InternalHosts           refile:/etc/opendkim/TrustedHosts
KeyTable                refile:/etc/opendkim/KeyTable
SigningTable            refile:/etc/opendkim/SigningTable
Mode                    sv
PidFile                 /var/run/opendkim/opendkim.pid
SignatureAlgorithm      rsa-sha256
UserID                  opendkim:opendkim
Socket                  inet:8891@localhost
EOF

cat <<EOF > /etc/opendkim/TrustedHosts
127.0.0.1
localhost
172.17.0.0/16
172.18.0.0/16
*.$DOMAIN
EOF

cat <<EOF > /etc/opendkim/KeyTable
$SELECTOR._domainkey.$DOMAIN $DOMAIN:$SELECTOR:/etc/opendkim/keys/$DOMAIN/$SELECTOR.private
EOF

cat <<EOF > /etc/opendkim/SigningTable
*@$DOMAIN $SELECTOR._domainkey.$DOMAIN
EOF

chown -R opendkim:opendkim /etc/opendkim

# Connect Postfix to OpenDKIM
postconf -e "milter_protocol = 2"
postconf -e "milter_default_action = accept"
postconf -e "smtpd_milters = inet:localhost:8891"
postconf -e "non_smtpd_milters = inet:localhost:8891"

systemctl restart opendkim
systemctl restart postfix

echo "--- DKIM PUBLIC KEY ---"
cat /etc/opendkim/keys/$DOMAIN/$SELECTOR.txt
echo "--- END DKIM PUBLIC KEY ---"
