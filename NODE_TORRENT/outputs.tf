output "ec2_public_dns" {
  value = aws_instance.ec2_basics.public_dns
}
